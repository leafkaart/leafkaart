const express = require('express');
const { listApproved, getById, listByCategory, listByDealer, listByEmployee, search } = require('../../controllers/customer/customerProductController');
const auth = require('../../middlewares/authMiddleware');
const router = express.Router();

router.get('/listApproved', auth, listApproved);
router.get('/getById/:id', auth, getById);
router.get('/listByCategory/:CategoryId', auth, listByCategory);
router.get('/dealer/:dealerId', auth, listByDealer);
router.get('/employee/:employeeId', auth, listByEmployee);
router.get('/search', auth, search);

module.exports = router;
