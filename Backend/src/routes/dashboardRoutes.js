const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

// GET /api/dashboard
router.get("/", protect, dashboardController.getDashboardStats);

module.exports = router;