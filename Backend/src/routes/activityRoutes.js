const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/rbacMiddleware");
const {
  getAllActivityLogs,
  getUserActivityLog,
  getResourceActivityLog,
  getActivityStats,
} = require("../controllers/activityController");

// All routes require authentication
router.use(protect);

// GET ALL ACTIVITY LOGS (Admin only)
router.get("/admin/all", authorize("admin"), getAllActivityLogs);

// GET ACTIVITY STATISTICS (Admin only)
router.get("/admin/stats", authorize("admin"), getActivityStats);

// GET USER'S OWN ACTIVITY LOG
router.get("/my-logs", getUserActivityLog);

// GET ACTIVITY LOG FOR SPECIFIC RESOURCE
router.get("/:resource/:resourceId", getResourceActivityLog);

module.exports = router;
