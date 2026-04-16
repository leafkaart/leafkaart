const express = require('express');
const auth = require("../middlewares/authMiddleware");
const { listNotifications, readNotification } = require('../controllers/notification/notificationController');
const router = express.Router();

router.get('/listNotifications', auth, listNotifications);
router.patch('/readNotification/:id', auth, readNotification);

module.exports = router;
