const express = require('express');
const { listOrders, getOrder, updateOrderStatus, updatePaymentStatus, assignOrderToDealer,unassignOrderToDealer, handleReturnRequest } = require('../../controllers/admin/adminOrderController');
const auth = require('../../middlewares/authMiddleware');
const router = express.Router();

router.get('/listOrders', auth, listOrders);
router.get('/getOrder/:id', auth, getOrder);
router.patch('/updateOrderStatus/:id', auth, updateOrderStatus);
router.patch('/updatePaymentStatus/:id', auth, updatePaymentStatus);
router.post('/assignOrderToDealer/:id', auth, assignOrderToDealer);
router.delete('/unassignOrderToDealer/:id', auth, unassignOrderToDealer);
router.post("/return-action/:id", auth, handleReturnRequest);
module.exports = router;
