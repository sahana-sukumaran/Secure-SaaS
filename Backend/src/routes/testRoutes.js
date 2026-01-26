const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/rbacMiddleware");

// Any authenticated user can access
router.get("/protected", protect, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    user: req.user,
  });
});

// Only admin can access
router.get("/admin-only", protect, authorize("admin"), (req, res) => {
  res.json({
    message: "Admin dashboard",
    data: "Admin-only sensitive data",
  });
});

// Admin & Manager can access
router.get("/manager-panel", protect, authorize("admin", "manager"), (req, res) => {
  res.json({
    message: "Manager panel - accessible to admin and manager",
    data: "Team management data",
  });
});

// All roles can access (but must be authenticated)
router.get("/user-profile", protect, (req, res) => {
  res.json({
    message: "User profile",
    user: req.user,
  });
});

module.exports = router;