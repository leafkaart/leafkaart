const express = require('express');
const { initiatePayment, verifyPayment } = require('../controllers/payment/paymentController');
const auth = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/initiatePayment', auth, initiatePayment);
router.post('/verifyPayment', auth, verifyPayment);

module.exports = router;