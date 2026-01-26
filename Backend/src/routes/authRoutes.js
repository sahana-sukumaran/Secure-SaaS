const express = require("express");
const router = express.Router();
const { register, login, updateUserRole } = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/rbacMiddleware");

router.post("/register", register);
router.post("/login", login);

// Update user role (admin only)
router.put("/:userId/role", protect, authorize("admin"), updateUserRole);

module.exports = router;
