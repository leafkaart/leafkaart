const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitNotification } = require("../socket");

const getUserIdsByRoles = async (roles = []) => {
  if (!roles.length) return [];
  const users = await User.find({ role: { $in: roles }, isActive: true }).select("_id");
  return users.map((user) => String(user._id));
};

async function createAndSendNotifications({ userIds = [], message, type, orderId, productId, eventKey }) {
  if (!message || !type) return [];
  const recipients = [...new Set(userIds.filter(Boolean).map(String))];
  const notifications = await Promise.all(recipients.map(async (userId) => {
    const data = { userId, message, type, orderId, productId };
    if (!eventKey) return Notification.create(data);

    try {
      const result = await Notification.findOneAndUpdate(
        { userId, eventKey },
        { $setOnInsert: { ...data, eventKey, isRead: false, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true, returnDocument: "after", includeResultMetadata: true, timestamps: false }
      );
      return result.lastErrorObject.updatedExisting ? null : result.value;
    } catch (error) {
      if (error.code !== 11000) throw error;
      return null;
    }
  }));
  notifications.filter(Boolean).forEach(emitNotification);
  return notifications.filter(Boolean);
}

module.exports = { getUserIdsByRoles, createAndSendNotifications };
