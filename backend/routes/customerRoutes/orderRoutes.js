const express = require('express');
const { createOrder, listOrders, getOrder } = require('../../controllers/customer/customerOrderController');
const router = express.Router();

router.post('/createOrder', createOrder);
router.get('/listOrders', listOrders);
router.get('/getOrder/:id', getOrder);

module.exports = router;