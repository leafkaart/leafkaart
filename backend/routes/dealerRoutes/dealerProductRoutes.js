const express = require('express');
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateStock
} = require('../../controllers/dealer/dealerProductController');
const auth = require('../../middlewares/authMiddleware');
const { dealerMiddleware } = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.post('/createProduct', auth, dealerMiddleware, createProduct);
router.get('/listProducts', auth, listProducts);
router.get('/getProduct/:id', auth, dealerMiddleware, getProduct);
router.patch('/updateProduct/:id', auth, updateProduct);
router.delete('/deleteProduct/:id', auth, dealerMiddleware, deleteProduct);
router.patch('/update-stock/:id', auth, dealerMiddleware, updateStock);

module.exports = router;
