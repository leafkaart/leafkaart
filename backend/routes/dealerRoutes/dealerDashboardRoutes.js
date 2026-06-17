const express = require("express");
const auth = require("../../middlewares/authMiddleware");
const { dealerMiddleware } = require("../../middlewares/roleMiddleware");
const { getDealerDashboard } = require("../../controllers/dealer/dealerDashboardController");

const router = express.Router();

router.get("/overview", auth, dealerMiddleware, getDealerDashboard);

module.exports = router;
