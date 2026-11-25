const { notifyCustomerOfDispatch } = require("../../utils/orderDispatch");
const Order = require("../../models/Order");
const { runOrderChange } = require("../../utils/orderInventory");
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

// Allowed order status flow for employees
const ALLOWED_STATUS = [
  "pending",
  "confirmed",
  "assigned",
  "payment_approved",
  "processing",
  "dispatched",
  "in_transit",
  "packed",
  "ready_for_dispatch",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
  "refunded",
];

// LIST ASSIGNED ORDERS
exports.assignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ assignedTo: req.user._id })
      .sort({ createdAt: -1 })
      .populate("items.product");

    res.json({ success: true, orders });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE ORDER STATUS (EMPLOYEE ONLY)
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    // Validation
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`
      });
    }

    const order = await runOrderChange(async (session, syncInventory) => {
      const order = await Order.findOne({
        _id: req.params.id,
        assignedTo: req.user._id,
      }).setOptions({ strictQuery: false }).session(session);
      if (!order) return null;

      await syncInventory(order, status);
      if (order.status !== status) {
        order.status = status;
        if (status === "dispatched") order.dispatchPending = true;
        appendOrderActivity(order, {
          action: getStatusLabel(status),
          remarks: notes || `Status updated to ${status}`,
          actor: req.user,
          status,
        });
      }
      if (order.isModified()) await order.save({ session });
      return order;
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to this employee" });
    }
    if (status === "dispatched") notifyCustomerOfDispatch(order).catch((error) => console.error("Dispatch delivery pending", error.message));

    res.json({ success: true, message: "Order status updated", order });

  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.status ? err.message : "Could not update the order status." });
  }
};
