const express = require('express');
const { completeDashboard } = require('../../controllers/admin/adminDashboardController');
const router = express.Router();

router.get('/completeDashboard', completeDashboard);

module.exports = router;