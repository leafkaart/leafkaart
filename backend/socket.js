const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

let ioInstance;
const notificationRoom = (id) => `notifications:${id}`;

function initSocket(server) {
  ioInstance = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace(/^Bearer /i, "");
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(id).select("role activeTokens");
      if (!user || (user.role === "customer" && !user.activeTokens.some((entry) => entry.token === token))) {
        return next(new Error("Unauthorized"));
      }
      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.join(notificationRoom(socket.data.userId));
  });
}

function emitNotification(notification) {
  ioInstance?.to(notificationRoom(notification.userId)).emit("receive-notification", notification);
}

function emitNotificationRead(userId, notificationId) {
  ioInstance?.to(notificationRoom(userId)).emit("notification-read", String(notificationId));
}

module.exports = { initSocket, emitNotification, emitNotificationRead };
