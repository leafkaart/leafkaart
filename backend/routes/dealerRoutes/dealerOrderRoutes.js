const express = require('express');
const {
  assignedOrders,
  updateStatus
} = require('../../controllers/dealer/dealerOrderController');
const auth = require('../../middlewares/authMiddleware');
const { dealerMiddleware } = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.get('/assigned-orders', auth, dealerMiddleware, assignedOrders);
router.patch('/:id/status', auth, dealerMiddleware, updateStatus);

module.exports = router;
