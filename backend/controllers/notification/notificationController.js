const { emitNotificationRead } = require("../../socket");
const Notification = require("../../models/Notification");

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      ...(req.query.unread === "true" && { isRead: { $ne: true } }),
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not load or update notifications" });
  }
};

exports.readNotification = async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    emitNotificationRead(req.user._id, updated._id);
    res.json({
      success: true,
      notification: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not load or update notifications" });
  }
};
