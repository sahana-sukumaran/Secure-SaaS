const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/rbacMiddleware");
const {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
} = require("../controllers/projectController");

// All routes require authentication
router.use(protect);

// CREATE PROJECT (Any authenticated user)
router.post("/", createProject);

// GET ALL USER'S PROJECTS
router.get("/", getUserProjects);

// GET PROJECT BY ID
router.get("/:projectId", getProjectById);

// UPDATE PROJECT (Only owner)
router.put("/:projectId", updateProject);

// DELETE PROJECT (Only owner)
router.delete("/:projectId", deleteProject);

// ADD MEMBER TO PROJECT (Only owner)
router.post("/:projectId/members", addMember);

module.exports = router;
