const express = require('express');
const { 
  createProduct, 
  listProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct 
} = require('../../controllers/employee/employeeProductController');

const router = express.Router();

router.post('/createProduct', createProduct);
router.get('/listProducts', listProducts);
router.get('/getProduct/:id', getProduct);
router.patch('/updateProduct/:id', updateProduct);
router.delete('/deleteProduct/:id', deleteProduct);

module.exports = router;
