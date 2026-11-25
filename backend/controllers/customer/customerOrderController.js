const mongoose = require('mongoose');
const { customerCatalog } = require("../../utils/productVisibility");
const { IMAGE_TYPES, DOCUMENT_TYPES, validateUpload } = require("../../utils/validateUpload");
const { uploadEmiDocument } = require("../../utils/emiDocuments");
const { notifyOrderCreated } = require("../../utils/orderDispatch");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const Address = require("../../models/Address");
const { uploadImageToCloudinary } = require("../../utils/imageUploader");
const { appendOrderActivity } = require("../../utils/orderActivity");
const {
  getUserIdsByRoles,
  createAndSendNotifications,
} = require("../../utils/notificationHelper");

exports.createOrder = async (req, res) => {
  try {
    let {
      items,
      address,
      shippingCharges = 0,
      taxAmount = 0,
      discount = 0,
      grandTotal,
      paymentMethod,
      paymentStatus = false
    } = req.body || {};

    // ✅ FIX: Parse items if coming as string (form-data)
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid items format. Must be a JSON array",
        });
      }
    }

    // --- VALIDATE PAYMENT METHOD ---
    if (!paymentMethod || !['EMI', 'Cash On Delivery', 'QR'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Valid payment method is required (EMI, Cash On Delivery, or QR)",
      });
    }

    // --- VALIDATE ITEMS ---
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least 1 item",
      });
    }

    // --- VALIDATE ADDRESS ---
    if (!address || !mongoose.Types.ObjectId.isValid(address)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const addressExists = await Address.findOne({
      _id: new mongoose.Types.ObjectId(address),
      user: req.user._id
    });

    if (!addressExists) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // --- VALIDATE PRODUCTS & STOCK ---
    const requestedQuantities = new Map();
    for (const item of items) {
      if (!item?.product || !Number.isSafeInteger(Number(item.qty)) || Number(item.qty) < 1) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a product and qty >= 1",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          success: false,
          message: "An order item has an invalid product ID."
        });
      }

      const product = await Product.findOne({ _id: item.product, ...customerCatalog });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      const productId = String(product._id);
      const qty = Number(item.qty);
      const requested = (requestedQuantities.get(productId) || 0) + qty;
      requestedQuantities.set(productId, requested);
      if (product.stock < requested) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}`
        });
      }

      // --- SNAPSHOT DATA ---
      item.title = product.title;
      item.sku = product.sku;
      item.qty = qty;
      item.price = product.customerPrice ?? product.dealerPrice;
      item.dealerPrice = product.dealerPrice ?? item.price;
      item.total = item.price * item.qty;
      item.dealer = product.dealerId;
      item.product = new mongoose.Types.ObjectId(item.product);
    }

    // --- CALCULATE TOTALS ---
    const computedSubTotal = items.reduce((sum, i) => sum + i.total, 0);
    const dealerShowComputedSubTotal = items.reduce((sum, i) => {
      const dealerPrice = Number(i.dealerPrice ?? i.price ?? 0);
      return sum + dealerPrice * i.qty;
    }, 0);

    const computedGrandTotal =
      Number(computedSubTotal) +
      Number(shippingCharges) +
      Number(taxAmount) -
      Number(discount);

    // ✅ FIX: use epsilon comparison instead of strict equality to avoid
    // false "mismatch" errors from floating point rounding
    if ([grandTotal, shippingCharges, taxAmount, discount].some((amount) =>
      amount == null || amount === "" || !Number.isFinite(Number(amount)) || Number(amount) < 0)) {
      return res.status(400).json({ success: false, message: "Order amounts must be valid non-negative numbers" });
    }
    if (Math.abs(Number(grandTotal) - computedGrandTotal) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Grand total mismatch",
        expected: computedGrandTotal,
      });
    }

    const dealerShowComputedGrandTotal =
      Number(dealerShowComputedSubTotal) +
      Number(shippingCharges) +
      Number(taxAmount) -
      Number(discount);


    let paymentImageUrl = null;
    let addharFrontImageUrl = null;
    let aadharBackImageUrl = null;
    let panCardImageUrl = null;
    const otherDocuments = [];

    const paymentImage = req.files?.paymentImage;
    if (paymentImage) {
      validateUpload(paymentImage, paymentMethod === "EMI" ? DOCUMENT_TYPES : IMAGE_TYPES, "Payment attachment");
    }

    if (paymentMethod === "EMI") {
      const front = req.files?.addharfrontimage || req.files?.aadhaarImage;
      const back = req.files?.aadharbackimage;
      const pan = req.files?.pancardimage || req.files?.panImage;
      if (!front || !back || !pan) {
        return res.status(400).json({
          success: false,
          message: "Aadhaar front, Aadhaar back, and PAN card files are required for EMI payment.",
        });
      }
      const supporting = req.files?.otherDocuments || req.files?.otherDocument || req.files?.otherDocs;
      const docs = supporting ? [supporting].flat() : [];
      if (docs.length > 6) {
        return res.status(400).json({ success: false, message: "Upload at most six supporting documents." });
      }
      for (const [file, label] of [
        [front, "Aadhaar front"], [back, "Aadhaar back"], [pan, "PAN card"],
        ...docs.map((document) => [document, "Supporting document"]),
      ]) validateUpload(file, DOCUMENT_TYPES, label);
      addharFrontImageUrl = await uploadEmiDocument(front, "Aadhaar front");
      aadharBackImageUrl = await uploadEmiDocument(back, "Aadhaar back");
      panCardImageUrl = await uploadEmiDocument(pan, "PAN card");
      for (const doc of docs) {
        otherDocuments.push({
          url: await uploadEmiDocument(doc, "Supporting document"),
          name: doc.name || "Supporting document",
        });
      }
    }

    if (paymentImage) {
      if (paymentMethod === "EMI") {
        paymentImageUrl = await uploadEmiDocument(paymentImage, "Payment attachment");
      } else {
        try {
          const asset = await uploadImageToCloudinary(paymentImage, process.env.FOLDER_NAME || "payments", 1000, "auto");
          if (!asset?.secure_url) throw new Error("Missing payment image URL");
          paymentImageUrl = asset.secure_url;
        } catch (error) {
          console.error("Payment image upload failed", error);
          return res.status(502).json({ success: false, message: "Could not upload the payment image." });
        }
      }
    }

    // --- CREATE ORDER NUMBER ---
    const orderNumber = `ORD-${Date.now()}`;

    // --- CREATE ORDER ---
    const order = new Order({
      createdNotificationPending: true,
      orderNumber,
      user: req.user._id,
      items,
      subTotal: computedSubTotal,
      dealerShowSubTotal: dealerShowComputedSubTotal,
      shippingCharges,
      taxAmount,
      discount,
      grandTotal: computedGrandTotal,

      dealerShowGrandTotal: dealerShowComputedGrandTotal,
      address: new mongoose.Types.ObjectId(address),
      payment: req.body?.payment || null,
      paymentMethod,
      paymentImage: paymentImageUrl,
      emiDocuments:
        paymentMethod === "EMI"
          ? {
              aadhaarFront: addharFrontImageUrl,
              aadhaarBack: aadharBackImageUrl,
              panCard: panCardImageUrl,
              otherDocuments,
              status: "pending",
              uploadedAt: new Date(),
            }
          : {
              status: "pending",
              otherDocuments: [],
              uploadedAt: null,
            },
      paymentStatus: paymentStatus === 'true' || paymentStatus === true,
      paymentReview: {
        status: "pending",
      },
      timeline: [],
    });

    appendOrderActivity(order, {
      action: "Order Created",
      remarks: "Order created by customer",
      actor: req.user,
      status: "order_placed",
    });

    if (
      paymentImageUrl ||
      (paymentMethod === "EMI" &&
        (addharFrontImageUrl || aadharBackImageUrl || panCardImageUrl))
    ) {
      appendOrderActivity(order, {
        action: "Payment Submitted",
        remarks:
          paymentMethod === "EMI"
            ? "EMI documents submitted by customer"
            : "Payment proof submitted by customer",
        actor: req.user,
        status: order.status,
      });
    }

    await order.save();

    // --- CLEAR CART ---
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [], totalAmount: 0 } }
    ).catch((error) => console.error("Could not clear cart after order creation", error));

    await notifyOrderCreated(order).catch((error) => console.error("Order-created notification pending", error));

    return res.json({
      success: true,
      message: "Order created successfully",
      order,
    });

  } catch (err) {
    if (!err.status) console.error("Create order error:", err);
    const invalidOrder = ["ValidationError", "CastError"].includes(err.name);
    return res.status(err.status || (invalidOrder ? 400 : 500)).json({
      success: false,
      message: err.status ? err.message : invalidOrder
        ? "One or more order fields are invalid."
        : "The order could not be placed. Please try again.",
    });
  }
};

exports.listOrders = async (req, res) => {
  try {
    // ✅ FIX: scope to the logged-in customer only — previously returned
    // every order in the database to any authenticated user
    const orders = await Order.find({ user: req.user._id })
      .populate("address")
      .populate("items.product", "title sku brand images customerPrice")
      .populate("items.dealer", "name mobile")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    // ✅ FIX: filter by owner so a customer can't fetch another
    // customer's order just by changing the :id in the URL (IDOR)
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate("address")
      .populate("items.product")
      .populate("items.dealer");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      order
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.requestReturnOrder = async (req, res) => {
  try {
    const { reason, serialNumber, modelNumber, type } = req.body;
    const orderId = req.params.id;

    if (!type || !["return", "replace", "cancel"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'return', 'replace', or 'cancel'",
      });
    }

    // ✅ FIX: findById only accepts a single id, not a filter object —
    // passing { _id, user } into it caused a cast error / always failed.
    // Must use findOne to filter by both _id and owner.
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.returnRequest?.status === "requested") {
      return res.status(400).json({
        success: false,
        message: "Request already submitted",
      });
    }

    if (type !== "cancel" && (!req.files || !req.files.images)) {
      return res.status(400).json({
        success: false,
        message: "Minimum 2 images required",
      });
    }

    let images = [];
    if (req.files?.images) {
      images = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
    }

    if (type !== "cancel" && (images.length < 2 || images.length > 6)) {
      return res.status(400).json({
        success: false,
        message: "Upload min 2 and max 6 images",
      });
    }

    const uploadedImages = [];

    for (const img of images) {
      const upload = await uploadImageToCloudinary(
        img,
        "return-replace",
        1000,
        1000
      );

      if (!upload?.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }

      uploadedImages.push(upload.secure_url);
    }

    order.returnRequest = {
      type,
      status: "requested",
      reason,
      images: uploadedImages,
      serialNumber,
      modelNumber,
      requestedAt: new Date(),
    };

    appendOrderActivity(order, {
      action:
        type === "return"
          ? "Return Requested"
        : type === "replace"
          ? "Replacement Requested"
          : "Cancel Requested",
      remarks: reason || "Customer submitted a request",
      actor: req.user,
      status: order.status,
    });

    await order.save();

    const adminIds = await getUserIdsByRoles(["admin"]);
    const dealerIds = [];

    if (order.dealerAssign?.dealer) {
      dealerIds.push(order.dealerAssign.dealer.toString());
    } else {
      order.items.forEach((item) => {
        if (item.dealer) {
          dealerIds.push(item.dealer.toString());
        }
      });
    }

    const requestLabel =
      type === "return"
        ? "return"
        : type === "replace"
        ? "replacement"
        : "cancellation";

    await createAndSendNotifications({
      userIds: [...adminIds, ...dealerIds],
      orderId: order._id,
      message: `Customer requested ${requestLabel} for order ${order.orderNumber}`,
      type: "order",
    });

    return res.json({
      success: true,
      message: `${
        type === "return" ? "Return" : "Replacement"
      } request submitted successfully`,
    });

  } catch (err) {
    console.error("requestReturnOrder error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
