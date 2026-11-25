const Order = require("../models/Order");
const User = require("../models/User");
const { createAndSendNotifications, getUserIdsByRoles } = require("./notificationHelper");
const { sendEmail } = require("./emailService");

const EMAIL_LEASE_MS = 10 * 60 * 1000;

async function sendDispatchEmail(order, message) {
  const customer = await User.findById(order.user).select("email");
  if (!customer?.email) return true;
  const claimedAt = new Date();
  const claim = await Order.updateOne(
    { _id: order._id, dispatchPending: true, $or: [
      { dispatchEmailState: { $exists: false } },
      { dispatchEmailState: "sending", dispatchEmailClaimedAt: { $lt: new Date(Date.now() - EMAIL_LEASE_MS) } },
    ] },
    { $set: { dispatchEmailState: "sending", dispatchEmailClaimedAt: claimedAt } },
    { timestamps: false }
  );
  if (!claim.modifiedCount) {
    const state = await Order.findById(order._id).select("+dispatchEmailState");
    return state?.dispatchEmailState === "sent";
  }
  const ownClaim = { _id: order._id, dispatchEmailClaimedAt: claimedAt };
  try {
    await sendEmail({
      to: customer.email,
      subject: `Order ${order.orderNumber} dispatched`,
      text: message,
      messageId: `<dispatch-${order._id}@leafkaart.com>`,
      throwOnError: true,
    });
  } catch (error) {
    await Order.updateOne(ownClaim, { $unset: { dispatchEmailState: 1, dispatchEmailClaimedAt: 1 } }, { timestamps: false });
    throw error;
  }
  await Order.updateOne(ownClaim, { $set: { dispatchEmailState: "sent" }, $unset: { dispatchEmailClaimedAt: 1 } }, { timestamps: false });
  return true;
}

async function notifyCustomerOfDispatch(order) {
  if (!await Order.exists({ _id: order._id, dispatchPending: true })) return;
  const message = `Your order ${order.orderNumber} has been dispatched.`;
  await createAndSendNotifications({
    userIds: [order.user],
    message,
    type: "order",
    orderId: order._id,
    eventKey: `order-dispatched:${order._id}`,
  });
  if (!await sendDispatchEmail(order, message)) return;
  await Order.updateOne({ _id: order._id }, { $unset: { dispatchPending: 1 } }, { timestamps: false });
}

async function notifyOrderCreated(order) {
  const staff = await getUserIdsByRoles(["admin", "employee"]);
  const actor = order.timeline.find((event) => event.action === "Order Created");
  await createAndSendNotifications({
    userIds: staff,
    orderId: order._id,
    message: `New order ${order.orderNumber} placed by ${actor?.performedByName || "a customer"} (Customer).`,
    type: "order",
    eventKey: `order-created:${order._id}`,
  });
  await Order.updateOne({ _id: order._id }, { $unset: { createdNotificationPending: 1 } }, { timestamps: false });
}

function startOrderNotificationWorker() {
  let running = false;
  const interval = setInterval(async () => {
    if (running || Order.db.readyState !== 1) return;
    running = true;
    try {
      for (const [field, send] of [
        ["createdNotificationPending", notifyOrderCreated],
        ["dispatchPending", notifyCustomerOfDispatch],
      ]) {
        const orders = await Order.find({ [field]: true }).sort({ updatedAt: 1 }).limit(25);
        await Promise.allSettled(orders.map(async (order) => {
          try {
            await send(order);
          } catch (error) {
            console.error("Order notification delivery remains pending", String(order._id), error.message);
          }
        }));
      }
    } catch (error) {
      console.error("Could not process pending order notifications", error.message);
    } finally {
      running = false;
    }
  }, 30_000);
  interval.unref();
}

module.exports = { notifyCustomerOfDispatch, notifyOrderCreated, startOrderNotificationWorker };
