const mongoose = require('mongoose');
const Order = require('../../models/Order');
const { sendEmail } = require("../../utils/emailService");
const dealerTemplate = require("../../utils/dealerAssignedTemplate");
const customerTemplate = require("../../utils/customerAssignedTemplate");

exports.listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, from, to, q } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const filter = {};
    if (status) filter.status = status;
    if (from || to) filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
    if (q) filter.$text = { $search: q };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('items.product', 'title sku price')
        .populate('user', 'name email phone')
        .populate('address', 'line1 line2 city state zip')
        .populate('dealerAssign.dealer', 'name email')
        .populate('timeline.changedBy', 'name email'),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: { orders, total, page: Number(page), limit: Number(limit) }
    });
  } catch (err) {
    console.error('listOrders err', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid order id required",
      });
    }

    const order = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("address")
      .populate("items.product", "title slug sku price")
      .populate("dealerAssign.dealer", "name email")
      .populate("dealerAssign.assignedBy", "name email")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("getOrder error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid order id required",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (status) order.status = status;

    if (notes || status) {
      order.timeline.push({
        status: status || order.status,
        notes: notes || "",
        changedBy: req.user._id,
        at: new Date()
      });
    }

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("address")
      .populate("items.product", "title slug sku price")
      .populate("dealerAssign.dealer", "name email")
      .populate("dealerAssign.assignedBy", "name email")
      .populate("timeline.changedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder
    });

  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid, paymentMethod, paymentImage } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid order id required",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update payment fields
    if (typeof isPaid === "boolean") order.isPaid = isPaid;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentImage) order.paymentImage = paymentImage;

    // Update paymentStatus flag based on isPaid
    order.paymentStatus = !!isPaid;

    // Add timeline entry
    order.timeline.push({
      status: order.status,
      notes: `Payment updated: ${isPaid ? "Paid" : "Pending"} via ${paymentMethod || "N/A"}`,
      changedBy: req.user._id,
      at: new Date()
    });

    await order.save();

    // Populate fields for response
    const updatedOrder = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("address")
      .populate("items.product", "title slug sku price")
      .populate("dealerAssign.dealer", "name email")
      .populate("dealerAssign.assignedBy", "name email")
      .populate("timeline.changedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: updatedOrder
    });

  } catch (err) {
    console.error("updatePaymentStatus error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.assignOrderToDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const { dealerId, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(dealerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dealer id"
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.dealerAssign) {
      return res.status(400).json({
        success: false,
        message: "Dealer already assigned to this order"
      });
    }

    order.dealerAssign = {
      dealer: dealerId,
      assignedBy: req.user._id,
      notes
    };

    order.status = "processing";

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("dealerAssign.dealer", "name email storeName")
      .populate("dealerAssign.assignedBy", "name email")
      .populate("user", "name email mobile");

    if (updatedOrder.dealerAssign.dealer.email) {
      await sendEmail({
        to: updatedOrder.dealerAssign.dealer.email,
        subject: `New Order Assigned: ${updatedOrder.orderNumber}`,
        html: dealerTemplate(
          updatedOrder.dealerAssign.dealer.name,
          updatedOrder.orderNumber,
          updatedOrder.user.name
        )
      });
    }

    if (updatedOrder.user.email) {
      await sendEmail({
        to: updatedOrder.user.email,
        subject: `Your Order ${updatedOrder.orderNumber} is Assigned`,
        html: customerTemplate(
          updatedOrder.user.name,
          updatedOrder.orderNumber,
          updatedOrder.dealerAssign.dealer.name
        )
      });
    }

    return res.json({
      success: true,
      message: "Dealer assigned successfully",
      data: updatedOrder
    });

  } catch (err) {
    console.error("assignOrderToDealer error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


exports.unassignOrderToDealer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id"
      });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    if (!order.dealerAssign) {
      return res.status(400).json({
        success: false,
        message: "No dealer assigned to this order"
      });
    }
    order.dealerAssign = null;
    order.status = "order_placed";
    await order.save();
    return res.json({
      success: true,
      message: "Dealer unassigned successfully"
    });
  }
  catch (err) {
    console.error("unassignOrderToDealer error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


