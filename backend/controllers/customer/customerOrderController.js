const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const Address = require("../../models/Address");

exports.createOrder = async (req, res) => {
  try {
    const { items, address, subTotal, shippingCharges, taxAmount, discount, grandTotal } = req.body;

    // --- VALIDATION ---
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least 1 item",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const addressExists = await Address.findOne({ _id: address, user: req.user._id });

    if (!addressExists) {
      return res.status(404).json({
        success: false,
        message: "Invalid address",
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product || !item.qty || item.qty < 1) {
        return res.status(400).json({
          success: false,
          message: "Each item must contain product and qty >= 1",
        });
      }

      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      // Stock check
      if (product.stock < item.qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}`,
        });
      }

      // Append dynamic product data
      item.title = product.title;
      item.sku = product.sku;
      item.price = product.offerPrice || product.price;
      item.total = item.price * item.qty;
      item.dealer = product.dealer;
    }

    // --- FINAL TOTAL VALIDATION ---
    const computedSubTotal = items.reduce((s, it) => s + it.total, 0);
    const computedGrandTotal = (computedSubTotal + (shippingCharges || 0) + (taxAmount || 0)) - (discount || 0);

    if (parseFloat(grandTotal) !== parseFloat(computedGrandTotal)) {
      return res.status(400).json({
        success: false,
        message: "Grand total mismatch",
        expected: computedGrandTotal,
      });
    }

    // Create order number
    const orderNumber = "ORD-" + Date.now();

    // Create order
    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      items,
      subTotal: computedSubTotal,
      shippingCharges: shippingCharges || 0,
      taxAmount: taxAmount || 0,
      discount: discount || 0,
      grandTotal: computedGrandTotal,
      address,
      payment: req.body.payment || null,
      timeline: [
        {
          status: "order_placed",
          notes: "Order created",
          changedBy: req.user._id,
        },
      ],
    });

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty },
      });
    }

    // Clear cart
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
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("items.product")
      .populate("address")
      .populate("payment");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({ success: true, order });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
