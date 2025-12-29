const express = require('express');
const { addToCart, getCart, updateItem, removeItem } = require('../../controllers/customer/cartController');
const router = express.Router();

router.post('/addToCart', addToCart);
router.get('/getCart', getCart);
router.patch('/updateItem/:id', updateItem);
router.delete('/removeItem/:id', removeItem);

module.exports = router;