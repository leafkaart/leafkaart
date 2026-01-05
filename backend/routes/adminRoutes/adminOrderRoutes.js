const express = require('express');
const { listOrders, getOrder, assignOrderToDealer } = require('../../controllers/admin/adminOrderController');
const auth = require('../../middlewares/authMiddleware');
const router = express.Router();

router.get('/listOrders', listOrders);
router.get('/getOrder', getOrder);
router.post('/assignOrderToDealer/:id', auth, assignOrderToDealer);

module.exports = router;