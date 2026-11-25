const express = require('express');
const { listOrders, getOrder, updateOrderStatus, updatePaymentStatus, assignOrderToDealer,unassignOrderToDealer, handleReturnRequest, getEmiDocument, reviewEmiDocuments } = require('../../controllers/admin/adminOrderController');
const auth = require('../../middlewares/authMiddleware');
const { adminOrEmployee, adminEmployeeOrDealer } = require('../../middlewares/roleMiddleware');
const router = express.Router();

router.get('/listOrders', auth, adminEmployeeOrDealer, listOrders);
router.get('/getOrder/:id', auth, adminEmployeeOrDealer, getOrder);
router.get('/:id/emi/documents/:documentId', auth, adminOrEmployee, getEmiDocument);
router.patch('/:id/emi/review', auth, adminOrEmployee, reviewEmiDocuments);
router.patch('/updateOrderStatus/:id', auth, adminOrEmployee, updateOrderStatus);
router.patch('/updatePaymentStatus/:id', auth, adminOrEmployee, updatePaymentStatus);
router.post('/assignOrderToDealer/:id', auth, adminOrEmployee, assignOrderToDealer);
router.delete('/unassignOrderToDealer/:id', auth, adminOrEmployee, unassignOrderToDealer);
router.post("/return-action/:id", auth, adminOrEmployee, handleReturnRequest);
module.exports = router;
