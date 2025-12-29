const express = require('express');
const { addAddress, listAddress, removeAddress, setDefaultAddress } = require('../../controllers/customer/addressController');
const router = express.Router();

router.post('/addAddress', addAddress);
router.get('/listAddress', listAddress);
router.delete('/removeAddress/:id', removeAddress);
router.patch("/setDefaultAddress/:id", setDefaultAddress);

module.exports = router;