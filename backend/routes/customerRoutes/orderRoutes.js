const express = require('express');
const { createOrder, listOrders, getOrder, requestReturnOrder} = require('../../controllers/customer/customerOrderController');
const auth = require('../../middlewares/authMiddleware');
const router = express.Router();

router.post('/createOrder', auth, createOrder);
router.get('/listOrders', auth, listOrders);
router.get('/getOrder/:id', auth, getOrder);
router.post("/return/:id", auth, requestReturnOrder);

module.exports = router;