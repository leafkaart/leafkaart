const express = require('express');
const { 
  createProduct, 
  listProducts, 
  getProduct, 
  updateProduct, 
  updateCommission,
  deleteProduct 
} = require('../../controllers/employee/employeeProductController');
const auth = require('../../middlewares/authMiddleware');
const { adminOrEmployee } = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.post('/createProduct', auth, adminOrEmployee, createProduct);
router.get('/listProducts', auth, adminOrEmployee, listProducts);
router.get('/getProduct/:id', auth, adminOrEmployee, getProduct);
router.patch('/updateProduct/:id', auth, adminOrEmployee, updateProduct);
router.patch('/commission/:id', auth, adminOrEmployee, updateCommission);
router.delete('/deleteProduct/:id', auth, adminOrEmployee, deleteProduct);

module.exports = router;
