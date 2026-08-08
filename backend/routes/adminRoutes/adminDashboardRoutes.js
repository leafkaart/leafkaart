const express = require('express');
const { completeDashboard } = require('../../controllers/admin/adminDashboardController');
const auth = require('../../middlewares/authMiddleware');
const { adminOrEmployee } = require('../../middlewares/roleMiddleware');
const router = express.Router();

router.get('/completeDashboard', auth, adminOrEmployee, completeDashboard);

module.exports = router;