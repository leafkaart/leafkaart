const express = require('express');
const { assignedOrders, updateStatus } = require('../../controllers/employee/employeeOrderController');
const auth = require('../../middlewares/authMiddleware');
const { employeeMiddleware } = require('../../middlewares/roleMiddleware');
const router = express.Router();

router.get('/assigned-orders', auth, employeeMiddleware, assignedOrders);
router.patch('/:id/status', auth, employeeMiddleware, updateStatus);

module.exports = router;
