const express = require('express');
const { listOrders, getOrder, assignOrder } = require('../../controllers/admin/adminOrderController');
const router = express.Router();

router.get('/listOrders', listOrders);
router.get('/getOrder', getOrder);
router.patch('/assignOrder/:id', assignOrder);

module.exports = router;