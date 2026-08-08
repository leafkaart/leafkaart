const express = require('express');
const { register, verifyOtp, login, logout, forgotPassword, resetPassword, getUserDetails, updateUserDetails } = require('../controllers/auth/authController');
const { dealerRegister, getAllDealers, updateDealer, deleteDealer } = require('../controllers/auth/dealerRegister');
const { employeeRegister, getAllEmployees, updateEmployee, deleteEmployee } = require('../controllers/auth/employeeRegister');
const {
    sendOtp,
    verifyAndRegister,
    verifyAndLogin,
    getAllCustomers,
    updateCustomer,
    deleteCustomer,
} = require('../controllers/auth/customerRegister');

const auth = require('../middlewares/authMiddleware');
const { adminMiddleware, adminOrEmployee } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/getUserDetails', auth, getUserDetails);
router.patch('/updateUserDetails', auth, updateUserDetails);

router.post('/dealer-register', dealerRegister);
router.get("/getAllDealers", auth, adminOrEmployee, getAllDealers);
router.patch("/updateDealer/:id", auth, adminMiddleware, updateDealer);
router.delete("/deleteDealer/:id", auth, adminMiddleware, deleteDealer);

router.post('/employee-register', auth, adminMiddleware, employeeRegister);
router.get("/getAllEmployees", auth, adminOrEmployee, getAllEmployees);
router.patch("/updateEmployee/:id", auth, adminMiddleware, updateEmployee);
router.delete("/deleteEmployee/:id", auth, adminMiddleware, deleteEmployee);

// ─── Customer (Twilio OTP) ────────────────────────────────────────────────────
router.post('/customer/send-otp', sendOtp);
router.post('/customer/verify-register', verifyAndRegister);
router.post('/customer/verify-login', verifyAndLogin);
router.get('/getAllCustomers', auth, adminOrEmployee, getAllCustomers);
router.patch('/updateCustomer/:id', auth, adminOrEmployee, updateCustomer);
router.delete('/deleteCustomer/:id', auth, adminOrEmployee, deleteCustomer);

module.exports = router;
