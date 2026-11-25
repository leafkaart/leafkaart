const mongoose = require("mongoose");
const Order = require("../../models/Order");
const User = require("../../models/User");
const { sendEmail } = require("../../utils/emailService");
const dealerTemplate = require("../../utils/dealerAssignedTemplate");
const customerTemplate = require("../../utils/customerAssignedTemplate");
const { Readable } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const { listEmiDocuments, documentSource } = require("../../utils/emiDocuments");
const { createAndSendNotifications } = require("../../utils/notificationHelper");
const { notifyCustomerOfDispatch } = require("../../utils/orderDispatch");
const { runOrderChange } = require("../../utils/orderInventory");
const { appendOrderActivity } = require("../../utils/orderActivity");

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "assigned",
  "payment_approved",
  "order_placed",
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

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  assigned: "Assigned",
  payment_approved: "Payment Approved",
  order_placed: "Order Created",
  processing: "Processing",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  packed: "Packed",
  ready_for_dispatch: "Ready for Dispatch",
  shipped: "Shipment Updated",
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

exports.listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, from, to, q } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const filter = {};

    if (req.user.role === "dealer") {
      filter["dealerAssign.dealer"] = req.user._id;
    }

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
        .populate("items.product", "title sku price images")
        .populate("user", "name email phone")
        .populate("address", "line1 line2 city state zip")
        .populate("dealerAssign.dealer", "name email")
        .populate("timeline.changedBy", "name email")
        .populate("timeline.performedById", "name email role")
        .populate("latestAction.performedById", "name email role")
        .populate("paymentReview.reviewedBy", "name email role"),

      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    console.error("listOrders err", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid order id required",
      });
    }

    const scope = req.user.role === "dealer" ? { "dealerAssign.dealer": req.user._id } : {};
    const order = await Order.findOne({ _id: id, ...scope })
      .populate("user", "name email mobile")
      .populate("address")
      .populate("items.product", "title slug sku price images")
      .populate("dealerAssign.dealer", "name email")
      .populate("dealerAssign.assignedBy", "name email")
      .populate("timeline.changedBy", "name email")
      .populate("timeline.performedById", "name email role")
      .populate("latestAction.performedById", "name email role")
      .populate("paymentReview.reviewedBy", "name email role");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...order.toJSON(),
        ...(["admin", "employee"].includes(req.user.role) && order.paymentMethod === "EMI" && {
          emiDocuments: {
            status: order.emiDocuments?.status || "pending",
            uploadedAt: order.emiDocuments?.uploadedAt || order.createdAt,
            reviewedByName: order.emiDocuments?.reviewedByName,
            reviewedAt: order.emiDocuments?.reviewedAt,
            files: listEmiDocuments(order).map(({ id, name }) => ({ id, name })),
          },
        }),
      },
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
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid order id required",
      });
    }

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await runOrderChange(async (session, syncInventory) => {
      const order = await Order.findById(id).session(session);
      if (!order) return null;

      await syncInventory(order, status);
      if (order.status !== status) {
        order.status = status;
        if (status === "dispatched") order.dispatchPending = true;
        appendOrderActivity(order, {
          action: getStatusLabel(status),
          remarks: `Status updated to ${getStatusLabel(status)}`,
          actor: req.user,
          status,
        });
      }
      if (order.isModified()) await order.save({ session });
      return order;
    });

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (status === "dispatched") notifyCustomerOfDispatch(order).catch((error) => console.error("Dispatch delivery pending", error.message));

    const updatedOrder = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("address")
      .populate("items.product", "title slug sku price")
      .populate("dealerAssign.dealer", "name email")
      .populate("dealerAssign.assignedBy", "name email")
      .populate("timeline.changedBy", "name email")
      .populate("timeline.performedById", "name email role")
      .populate("latestAction.performedById", "name email role");

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Could not update the order status.",
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      action,
      paymentStatus,
      paymentMethod,
      paymentImage,
      utrNumber,
      description,
      remarks,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid order id required",
      });
    }

    const normalizedAction =
      action ||
      (typeof paymentStatus === "boolean"
        ? paymentStatus
          ? "approve"
          : "reject"
        : null);

    if (!["approve", "reject"].includes(normalizedAction)) {
      return res.status(400).json({
        success: false,
        message: "Payment action must be approve or reject",
      });
    }

    if (
      normalizedAction === "approve" &&
      (!utrNumber || !String(utrNumber).trim() || !description || !String(description).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "UTR number and description are required to approve payment",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isApproved = normalizedAction === "approve";

    order.paymentStatus = isApproved;
    order.isPaid = isApproved;
    if (isApproved) {
      order.status = "payment_approved";
    }

    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paymentImage) order.paymentImage = paymentImage;

    order.paymentReview = {
      status: isApproved ? "approved" : "rejected",
      utrNumber: isApproved ? String(utrNumber).trim() : null,
      description: isApproved ? String(description).trim() : description || null,
      reviewedBy: req.user?._id || null,
      reviewedByName: req.user?.name || "System",
      reviewedByRole: req.user?.role || "system",
      reviewedAt: new Date(),
      remarks: remarks || (isApproved ? "Payment approved" : "Payment rejected"),
    };

    appendOrderActivity(order, {
      action: isApproved ? "Payment Approved" : "Payment Rejected",
      remarks:
        remarks ||
        (isApproved
          ? `Payment approved with UTR ${String(utrNumber).trim()}`
          : "Payment rejected"),
      actor: req.user,
      status: order.status,
    });

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("address")
      .populate("items.product", "title slug sku price")
      .populate("dealerAssign.dealer", "name email")
      .populate("dealerAssign.assignedBy", "name email")
      .populate("timeline.changedBy", "name email")
      .populate("timeline.performedById", "name email role")
      .populate("latestAction.performedById", "name email role")
      .populate("paymentReview.reviewedBy", "name email role");

    return res.status(200).json({
      success: true,
      message: isApproved
        ? "Payment approved successfully"
        : "Payment rejected successfully",
      data: updatedOrder,
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
        message: "Invalid order id",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(dealerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dealer id",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.dealerAssign) {
      return res.status(400).json({
        success: false,
        message: "Dealer already assigned to this order",
      });
    }

    if (!await User.exists({ _id: dealerId, role: "dealer" })) {
      return res.status(404).json({ success: false, message: "Dealer not found" });
    }
    order.dealerAssign = {
      dealer: dealerId,
      assignedBy: req.user._id,
      notes,
    };

    order.status = "assigned";
    appendOrderActivity(order, {
      action: "Dealer Assigned",
      remarks: notes || "Order assigned to dealer",
      actor: req.user,
      status: order.status,
    });

    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("dealerAssign.dealer", "name email storeName")
      .populate("dealerAssign.assignedBy", "name email")
      .populate("user", "name email mobile");

    await createAndSendNotifications({
      userIds: [dealerId],
      type: "order",
      orderId: order._id,
      message: `Order ${order.orderNumber} was assigned to you.`,
      eventKey: `order-assigned:${order._id}:${order.dealerAssign.assignedAt.getTime()}`,
    }).catch((error) => console.error("Dealer assignment notification failed", error));

    if (updatedOrder.dealerAssign.dealer.email) {
      await sendEmail({
        to: updatedOrder.dealerAssign.dealer.email,
        subject: `New Order Assigned: ${updatedOrder.orderNumber}`,
        html: dealerTemplate(
          updatedOrder.dealerAssign.dealer.name,
          updatedOrder.orderNumber,
          updatedOrder.user.name
        ),
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
        ),
      });
    }

    return res.json({
      success: true,
      message: "Dealer assigned successfully",
      data: updatedOrder,
    });
  } catch (err) {
    console.error("assignOrderToDealer error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.unassignOrderToDealer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    if (!order.dealerAssign) {
      return res.status(400).json({
        success: false,
        message: "No dealer assigned to this order",
      });
    }
    order.dealerAssign = null;
    order.status = "pending";
    appendOrderActivity(order, {
      action: "Dealer Unassigned",
      remarks: "Dealer assignment removed",
      actor: req.user,
      status: order.status,
    });
    await order.save();
    return res.json({
      success: true,
      message: "Dealer unassigned successfully",
    });
  } catch (err) {
    console.error("unassignOrderToDealer error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.handleReturnRequest = async (req, res) => {
  try {
    const { status, message } = req.body;
    const orderId = req.params.id;

    // ✅ Validate status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'approved' or 'rejected'",
      });
    }

    const requestType = await runOrderChange(async (session, syncInventory) => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
      if (order.returnRequest?.status !== "requested") {
        throw Object.assign(new Error("No pending return/replace request"), { status: 400 });
      }

      const requestType = order.returnRequest.type; // return / replace

      // ✅ Update request
      order.returnRequest.status = status;
      order.returnRequest.adminMessage = message;
      order.returnRequest.updatedAt = new Date();

      if (status === "approved") {
        order.status = { return: "refunded", cancel: "cancelled", replace: "processing" }[requestType] || order.status;
        await syncInventory(order, order.status);
      }

      // ✅ Timeline update
      const actionPerformed =
        status === "approved"
          ? requestType === "cancel"
            ? "Cancel Approved"
            : requestType === "return"
            ? "Refund Approved"
            : "Approve Replacement"
          : requestType === "cancel"
          ? "Cancel Rejected"
          : requestType === "return"
          ? "Refund Rejected"
          : "Reject Replacement";

      appendOrderActivity(order, {
        action: actionPerformed,
        remarks: message || `${requestType} request ${status}`,
        actor: req.user,
        status: order.status,
      });

      await order.save({ session });
      return requestType;
    });

    return res.json({
      success: true,
      message: `${requestType} request ${status}`,
    });

  } catch (err) {
    console.error("handleReturnRequest error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.status ? err.message : "Could not update the return request.",
    });
  }
};


exports.getEmiDocument = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    const order = await Order.findOne({ _id: req.params.id, paymentMethod: "EMI" });
    const file = order && listEmiDocuments(order).find(({ id }) => id === req.params.documentId);
    const source = file && documentSource(file.reference);
    if (!source) return res.status(404).json({ message: "Document not found" });

    const upstream = await fetch(source.url, { redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ message: "The document could not be opened" });
    }
    res.set({
      "Content-Type": source.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const extension = source.contentType === "application/pdf" ? "pdf" :
      source.contentType === "image/png" ? "png" : "jpg";
    res.attachment(`${file.id}.${extension}`);
    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (error) {
    console.error("Could not open EMI document", error);
    if (!res.headersSent && !res.destroyed) res.status(502).json({ message: "The document could not be opened" });
  }
};

exports.reviewEmiDocuments = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    const { status } = req.body || {};
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Select verified or rejected" });
    }
    const order = await Order.findOne({ _id: req.params.id, paymentMethod: "EMI" });
    if (!order) return res.status(404).json({ message: "EMI order not found" });
    if (!listEmiDocuments(order).length) return res.status(400).json({ message: "No documents are available to review" });

    const result = await Order.updateOne(
      { _id: order._id, "emiDocuments.status": { $nin: ["verified", "rejected"] } },
      { $set: {
        "emiDocuments.status": status,
        "emiDocuments.reviewedBy": req.user._id,
        "emiDocuments.reviewedByName": req.user.name,
        "emiDocuments.reviewedAt": new Date(),
      } }
    );
    if (!result.modifiedCount) return res.status(409).json({ message: "These documents have already been reviewed" });
    res.json({ success: true, message: "EMI document review saved" });
  } catch (error) {
    console.error("Could not review EMI documents", error);
    res.status(500).json({ message: "Could not save the document review" });
  }
};
