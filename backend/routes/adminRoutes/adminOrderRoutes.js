const express = require('express');
const { listOrders, getOrder, updateOrderStatus, updatePaymentStatus, assignOrderToDealer,unassignOrderToDealer } = require('../../controllers/admin/adminOrderController');
const auth = require('../../middlewares/authMiddleware');
const router = express.Router();

router.get('/listOrders', listOrders);
router.get('/getOrder/:id', getOrder);
router.patch('/updateOrderStatus/:id', updateOrderStatus);
router.patch('/updatePaymentStatus/:id', updatePaymentStatus);
router.post('/assignOrderToDealer/:id', auth, assignOrderToDealer);
router.delete('/unassignOrderToDealer/:id', auth, unassignOrderToDealer);

module.exports = router;