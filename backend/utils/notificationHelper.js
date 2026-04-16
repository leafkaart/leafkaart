const Notification = require("../models/Notification");
const User = require("../models/User");
const { connectedUsers, getIO } = require("../socket");

const normalizeIds = (ids = []) =>
  [...new Set(ids.filter(Boolean).map((id) => id.toString()))];

const getUserIdsByRoles = async (roles = []) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return [];
  }

  const users = await User.find({
    role: { $in: roles },
    isActive: true,
  }).select("_id");

  return users.map((user) => user._id.toString());
};

const createAndSendNotifications = async ({
  userIds = [],
  message,
  type,
  orderId,
  productId,
}) => {
  const uniqueUserIds = normalizeIds(userIds);

  if (!message || !type || uniqueUserIds.length === 0) {
    return [];
  }

  const notifications = await Notification.create(
    uniqueUserIds.map((userId) => ({
      userId,
      message,
      type,
      orderId,
      productId,
      isRead: false,
    }))
  );

  let io;
  try {
    io = getIO();
  } catch (error) {
    io = null;
  }

  if (io) {
    notifications.forEach((notification) => {
      const receiverSocketId = connectedUsers[notification.userId.toString()];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-notification", notification);
      }
    });
  }

  return notifications;
};

module.exports = {
  getUserIdsByRoles,
  createAndSendNotifications,
};
