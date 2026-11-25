const express = require('express');
const { pendingProducts, approveProduct, rejectProduct, getDealersAndProductsByPincode } = require('../../controllers/admin/adminProductController');
const auth = require('../../middlewares/authMiddleware');
const { createProduct, updateProduct } = require('../../controllers/dealer/dealerProductController');
const { adminMiddleware, adminOrEmployee } = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.post('/createProduct', auth, adminMiddleware, createProduct);
router.patch('/updateProduct/:id', auth, adminOrEmployee, updateProduct);
router.get('/pendingProducts', auth, adminOrEmployee, pendingProducts);
router.patch('/rejectProduct/:id', auth, adminOrEmployee, rejectProduct);
router.patch('/approveProduct/:id', auth, adminOrEmployee, approveProduct);
router.get('/dealers-by-pincode/:pinCode', auth, adminOrEmployee, getDealersAndProductsByPincode );

module.exports = router;