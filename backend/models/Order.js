const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    sku: { type: String },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    dealerPrice: { type: Number },
    total: { type: Number, required: true },
    attributes: Schema.Types.Mixed,
    dealer: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const dealerAssignSchema = new Schema(
  {
    dealer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    assignedAt: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    dispatchPending: { type: Boolean, select: false },
    createdNotificationPending: { type: Boolean, select: false },
    dispatchEmailClaimedAt: { type: Date, select: false },
    dispatchEmailState: { type: String, enum: ["sending", "sent"], select: false },
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], required: true },
    dealerAssign: {
      type: dealerAssignSchema,
      default: null,
    },
    subTotal: { type: Number, required: true },
    dealerShowSubTotal: { type: Number },
    shippingCharges: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    dealerShowGrandTotal: { type: Number },
    currency: { type: String, default: "INR" },
    address: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    paymentMethod: {
      type: String,
      enum: ["EMI", "Cash On Delivery", "QR"],
      required: true,
    },
    paymentImage: {
      type: String,
      default: null,
    },
    addharfrontimage: { type: String, default: null },
    aadharbackimage: { type: String, default: null },
    pancardimage: { type: String, default: null },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
    isPaid: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
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
      ],
      default: "order_placed",
      index: true,
    },
    timeline: [
      {
        status: String,
        action: { type: String, required: true },
        performedById: { type: Schema.Types.ObjectId, ref: "User" },
        performedByName: { type: String, required: true },
        performedByRole: { type: String, required: true },
        remarks: String,
        createdAt: { type: Date, default: Date.now },
        // Legacy aliases kept temporarily for backwards compatibility.
        actionPerformed: String,
        employeeId: { type: Schema.Types.ObjectId, ref: "User" },
        employeeName: String,
        employeeRole: String,
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
        notes: String,
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
        at: { type: Date, default: Date.now },
      },
    ],

    latestAction: {
      action: String,
      performedById: { type: Schema.Types.ObjectId, ref: "User" },
      performedByName: String,
      performedByRole: String,
      remarks: String,
      createdAt: Date,
      // Legacy aliases kept temporarily for backwards compatibility.
      actionPerformed: String,
      employeeId: { type: Schema.Types.ObjectId, ref: "User" },
      employeeName: String,
      employeeRole: String,
      timestamp: Date,
    },

    paymentReview: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        index: true,
      },
      utrNumber: { type: String, default: null },
      description: { type: String, default: null },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewedByName: { type: String, default: null },
      reviewedByRole: { type: String, default: null },
      reviewedAt: { type: Date, default: null },
      remarks: { type: String, default: null },
    },

    emiDocuments: {
      aadhaarFront: { type: String, default: null },
      aadhaarBack: { type: String, default: null },
      panCard: { type: String, default: null },
      otherDocuments: [
        {
          url: { type: String },
          name: { type: String },
        },
      ],
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      uploadedAt: { type: Date, default: null },
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewedByName: String,
      reviewedAt: Date,
    },

    meta: Schema.Types.Mixed,
    inventoryStatus: {
      state: {
        type: String,
        enum: ["none", "deducted", "restored"],
        default: "none",
      },
      status: { type: String },
      updatedAt: { type: Date },
    },
    returnRequest: {
      type: {
        type: String,
        enum: ["cancel", "return", "replace"],
      },
      status: {
        type: String,
        enum: ["none", "requested", "approved", "rejected"],
        default: "none",
        index: true,
      },
      reason: String,
      images: [String],
      serialNumber: String,
      modelNumber: String,
      adminMessage: String,
      requestedAt: Date,
      updatedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, order) {
        delete order.addharfrontimage;
        delete order.aadharbackimage;
        delete order.pancardimage;
        delete order.emiDocuments;
        delete order.dispatchEmailState;
        delete order.dispatchEmailClaimedAt;
        delete order.dispatchPending;
        delete order.createdNotificationPending;
        if (order.paymentMethod === "EMI") delete order.paymentImage;
        return order;
      },
    },
  }
);

orderSchema.index({ dispatchPending: 1, updatedAt: 1 }, { partialFilterExpression: { dispatchPending: true } });
orderSchema.index({ createdNotificationPending: 1, updatedAt: 1 }, { partialFilterExpression: { createdNotificationPending: true } });

module.exports = mongoose.model("Order", orderSchema);
