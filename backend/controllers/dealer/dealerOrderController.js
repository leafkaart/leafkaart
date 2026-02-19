const Order = require('../../models/Order');

// Dealer assigned orders
exports.assignedOrders = async (req, res) => {
  try {
    const dealerId = req.user._id;

    const orders = await Order.find({ "dealerAssign.dealer": dealerId })
      .populate("user", "name email phone")
      .populate("address")
      .populate("items.product", "title slug sku price")
      .populate("dealerAssign.dealer", "name email storeName")
      .populate("dealerAssign.assignedBy", "name email")
      .populate("timeline.changedBy", "name email")
      .sort({ createdAt: -1 }); 

    res.json({
      success: true,
      data: orders
    });

  } catch (err) {
    console.error("assignedOrders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Dealer update order status
exports.updateStatus = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, dealer: req.user._id },
      { status: req.body.status },
      { new: true }
    );

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
