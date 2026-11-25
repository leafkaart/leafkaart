const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  eventKey: String,
  message: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  type: {
    type: String,
    enum: ["order", "dealer", "product"],
  },
}, { timestamps: true });

notificationSchema.index({ userId: 1, eventKey: 1 }, {
  unique: true, partialFilterExpression: { eventKey: { $type: 'string' } },
});

module.exports = mongoose.model('Notification', notificationSchema);