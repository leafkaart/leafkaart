const Order = require('../../models/Order');
const {
  getUserIdsByRoles,
  createAndSendNotifications,
} = require("../../utils/notificationHelper");
const { appendOrderActivity } = require("../../utils/orderActivity");

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  assigned: "Assigned",
  payment_approved: "Payment Approved",
  processing: "Processing",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  packed: "Packed",
  ready_for_dispatch: "Ready for Dispatch",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
};

const getStatusLabel = (status) =>
  STATUS_LABELS[status] ||
  String(status || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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
    const order = await Order.findOne({
      _id: req.params.id,
      "dealerAssign.dealer": req.user._id,
    });

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    order.status = req.body.status;
    appendOrderActivity(order, {
      action: getStatusLabel(req.body.status),
      remarks: `Status updated to ${req.body.status}`,
      actor: req.user,
      status: req.body.status,
    });

    await order.save();

    const adminAndEmployeeIds = await getUserIdsByRoles(["admin", "employee"]);
    const recipients = [...adminAndEmployeeIds, order.user?.toString()];
    const statusMessage =
      req.body.status === "processing"
        ? `Order ${order.orderNumber} accepted by dealer`
        : `Order ${order.orderNumber} status updated to ${req.body.status}`;

    await createAndSendNotifications({
      userIds: recipients,
      orderId: order._id,
      message: statusMessage,
      type: "order",
    });

    res.json({ success: true, order });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
