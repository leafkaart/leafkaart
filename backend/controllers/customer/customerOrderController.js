const mongoose = require('mongoose');
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const Address = require("../../models/Address");
const { uploadImageToCloudinary } = require("../../utils/imageUploader");

// exports.createOrder = async (req, res) => {
//   try {
//     console.log("createOrdercreateOrder")
//     const { 
//       items, 
//       address, 
//       shippingCharges = 0, 
//       taxAmount = 0, 
//       discount = 0, 
//       grandTotal,
//       paymentMethod,
//       paymentStatus = false
//     } = req.body;
//     console.log(req.body, "req.bodyreq.body");
//     // --- VALIDATE PAYMENT METHOD ---
//     if (!paymentMethod || !['EMI', 'Cash On Delivery', 'QR'].includes(paymentMethod)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid payment method is required (EMI, Cash On Delivery, or QR)",
//       });
//     }

//     // --- VALIDATE ITEMS ---
//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Order must contain at least 1 item",
//       });
//     }

//     // --- VALIDATE ADDRESS ---
//     if (!address || !mongoose.Types.ObjectId.isValid(address)) {
//       return res.status(400).json({ success: false, message: "Invalid address ID" });
//     }

//     const addressExists = await Address.findOne({ 
//       _id: new mongoose.Types.ObjectId(address), 
//       user: req.user._id 
//     });
//     if (!addressExists) {
//       return res.status(404).json({ success: false, message: "Address not found" });
//     }

//     // --- UPLOAD PAYMENT IMAGE (if provided) ---
//     let paymentImageUrl = null;
//     if (req.files && req.files.paymentImage) {
//       const paymentImage = req.files.paymentImage;
      
//       const upload = await uploadImageToCloudinary(
//         paymentImage,
//         process.env.FOLDER_NAME || "payments",
//         1000,
//         1000
//       );

//       if (!upload.secure_url) {
//         return res.status(500).json({ 
//           success: false, 
//           message: "Failed to upload payment image" 
//         });
//       }

//       paymentImageUrl = upload.secure_url;
//     }

//     // --- VALIDATE PRODUCTS & STOCK ---
//     for (const item of items) {
//       if (!item.product || !item.qty || item.qty < 1) {
//         return res.status(400).json({
//           success: false,
//           message: "Each item must have a product and qty >= 1",
//         });
//       }

//       if (!mongoose.Types.ObjectId.isValid(item.product)) {
//         return res.status(400).json({ 
//           success: false, 
//           message: `Invalid product ID: ${item.product}` 
//         });
//       }

//       const product = await Product.findById(new mongoose.Types.ObjectId(item.product));
//       if (!product) {
//         return res.status(404).json({ 
//           success: false, 
//           message: `Product not found: ${item.product}` 
//         });
//       }

//       if (!product.isActive || !product.isApproved) {
//         return res.status(400).json({ 
//           success: false, 
//           message: `Product not available: ${product.title}` 
//         });
//       }

//       if (product.stock < item.qty) {
//         return res.status(400).json({ 
//           success: false, 
//           message: `Insufficient stock for ${product.title}` 
//         });
//       }

//       // --- ADD SNAPSHOT DATA ---
//       item.title = product.title;
//       item.sku = product.sku;
//       item.price = product.customerPrice || product.dealerPrice;
//       item.total = item.price * item.qty;
//       item.dealer = product.dealerId;
//       item.product = new mongoose.Types.ObjectId(item.product);
//     }

//     // --- CALCULATE TOTALS ---
//     const computedSubTotal = items.reduce((sum, i) => sum + i.total, 0);
//     const computedGrandTotal = computedSubTotal + shippingCharges + taxAmount - discount;

//     if (parseFloat(grandTotal) !== parseFloat(computedGrandTotal)) {
//       return res.status(400).json({
//         success: false,
//         message: "Grand total mismatch",
//         expected: computedGrandTotal,
//       });
//     }

//     // --- CREATE ORDER NUMBER ---
//     const orderNumber = "ORD-" + Date.now();

//     // --- CREATE ORDER ---
//     const order = await Order.create({
//       orderNumber,
//       user: req.user._id,
//       items,
//       subTotal: computedSubTotal,
//       shippingCharges,
//       taxAmount,
//       discount,
//       grandTotal: computedGrandTotal,
//       address: new mongoose.Types.ObjectId(address),
//       payment: req.body.payment || null,
//       paymentMethod,
//       paymentImage: paymentImageUrl,
//       paymentStatus: paymentStatus === 'true' || paymentStatus === true,
//       timeline: [
//         {
//           status: "order_placed",
//           notes: "Order created",
//           changedBy: req.user._id,
//         },
//       ],
//     });

//     // --- DEDUCT STOCK ---
//     for (const item of items) {
//       await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
//     }

//     // --- CLEAR CART ---
//     await Cart.findOneAndUpdate(
//       { user: req.user._id }, 
//       { $set: { items: [], totalAmount: 0 } }
//     );

//     return res.json({
//       success: true,
//       message: "Order created successfully",
//       order,
//     });

//   } catch (err) {
//     console.error("Create order error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

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
    } = req.body;

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

    // --- UPLOAD PAYMENT IMAGE (if provided) ---
    let paymentImageUrl = null;

    if (req.files && req.files.paymentImage) {
      const paymentImage = req.files.paymentImage;

      const upload = await uploadImageToCloudinary(
        paymentImage,
        process.env.FOLDER_NAME || "payments",
        1000,
        1000
      );

      if (!upload?.secure_url) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to upload payment image" 
        });
      }

      paymentImageUrl = upload.secure_url;
    }

    // --- VALIDATE PRODUCTS & STOCK ---
    for (const item of items) {
      if (!item.product || !item.qty || item.qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a product and qty >= 1",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid product ID: ${item.product}` 
        });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product not found: ${item.product}` 
        });
      }

      if (!product.isActive || !product.isApproved) {
        return res.status(400).json({ 
          success: false, 
          message: `Product not available: ${product.title}` 
        });
      }

      if (product.stock < item.qty) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.title}` 
        });
      }

      // --- SNAPSHOT DATA ---
      item.title = product.title;
      item.sku = product.sku;
      item.price = product.customerPrice || product.dealerPrice;
      item.total = item.price * item.qty;
      item.dealer = product.dealerId;
      item.product = new mongoose.Types.ObjectId(item.product);
    }

    // --- CALCULATE TOTALS ---
    const computedSubTotal = items.reduce((sum, i) => sum + i.total, 0);

    const computedGrandTotal =
      Number(computedSubTotal) +
      Number(shippingCharges) +
      Number(taxAmount) -
      Number(discount);

    if (Number(grandTotal) !== Number(computedGrandTotal)) {
      return res.status(400).json({
        success: false,
        message: "Grand total mismatch",
        expected: computedGrandTotal,
      });
    }

    // --- CREATE ORDER NUMBER ---
    const orderNumber = "ORD-" + Date.now();

    // --- CREATE ORDER ---
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items,
      subTotal: computedSubTotal,
      shippingCharges,
      taxAmount,
      discount,
      grandTotal: computedGrandTotal,
      address: new mongoose.Types.ObjectId(address),
      payment: req.body.payment || null,
      paymentMethod,
      paymentImage: paymentImageUrl,
      paymentStatus: paymentStatus === 'true' || paymentStatus === true,
      timeline: [
        {
          status: "order_placed",
          notes: "Order created",
          changedBy: req.user._id,
        },
      ],
    });

    // --- DEDUCT STOCK ---
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty }
      });
    }

    // --- CLEAR CART ---
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [], totalAmount: 0 } }
    );

    return res.json({
      success: true,
      message: "Order created successfully",
      order,
    });

  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email mobile")
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
    const order = await Order.findById(req.params.id)
      .populate("user", "name email mobile")
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

