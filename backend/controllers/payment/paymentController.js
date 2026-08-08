const Payment = require("../../models/Payment");
const Order = require("../../models/Order");

exports.initiatePayment = async (req, res) => {
  try {
    const { orderId, amount, provider = "cashfree", currency = "INR", method } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: "orderId and amount are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const payment = await Payment.create({
      order: orderId,
      user: req.user._id,
      provider,
      amount,
      currency,
      method,
      status: "initiated",
    });

    return res.status(201).json({
      message: "Payment initiated successfully",
      payment,
    });
  } catch (err) {
    console.error("Initiate Payment Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, providerPaymentId, status } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({ message: "paymentId and status are required" });
    }

    const allowedStatuses = ["pending", "success", "failed", "refunded"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const payment = await Payment.findOne({ _id: paymentId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = status;
    if (providerPaymentId) payment.providerPaymentId = providerPaymentId;
    await payment.save();

    return res.status(200).json({
      message: "Payment status updated successfully",
      payment,
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
