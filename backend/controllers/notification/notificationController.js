const Notification = require("../../models/Notification");

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

    res.json({
      success: true,
      notification: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
