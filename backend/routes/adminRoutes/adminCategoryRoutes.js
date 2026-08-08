const express = require('express');
const { createCategory, listCategories, updateCategory, deleteCategory } = require('../../controllers/admin/adminCategoryController');
const auth = require('../../middlewares/authMiddleware');
const { adminOrEmployee } = require('../../middlewares/roleMiddleware');
const router = express.Router();

router.post('/createCategory', auth, adminOrEmployee, createCategory);
router.get('/listCategories', listCategories);
router.patch('/updateCategory/:id', auth, adminOrEmployee, updateCategory);
router.delete('/deleteCategory/:id', auth, adminOrEmployee, deleteCategory);

module.exports = router;