const express = require('express');
const { createSubCategory, listSubCategories, updateSubCategory, deleteSubCategory, getSubcategoryByCategory } = require('../../controllers/admin/adminSubCategoryController');
const auth = require('../../middlewares/authMiddleware');
const { adminOrEmployee } = require('../../middlewares/roleMiddleware');
const router = express.Router();

router.post('/createSubCategory', auth, adminOrEmployee, createSubCategory);
router.get('/listSubCategories', listSubCategories);
router.patch('/updateSubCategory/:id', auth, adminOrEmployee, updateSubCategory);
router.delete('/deleteSubCategory/:id', auth, adminOrEmployee, deleteSubCategory);
router.get('/getSubCategory/:categoryId', getSubcategoryByCategory);

module.exports = router;