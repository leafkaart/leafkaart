const express = require('express');
const { addWishlist, listWishlist, removeWishlist } = require('../../controllers/customer/wishlistController');
const router = express.Router();

router.post('/addWishlist', addWishlist);
router.get('/listWishlist', listWishlist);
router.delete('/removeWishlist/:id', removeWishlist);

module.exports = router;