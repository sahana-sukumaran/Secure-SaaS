const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  getTenantMembers,
} = require("../controllers/projectController");
// All routes require authentication
router.use(protect);

// CREATE PROJECT (Any authenticated user)
router.post("/", createProject);

// GET ALL USER'S PROJECTS
router.get("/", getUserProjects);
router.get("/members", getTenantMembers);
// GET PROJECT BY ID
router.get("/:projectId", getProjectById);

// UPDATE PROJECT (Only owner)
router.put("/:projectId", updateProject);

// DELETE PROJECT (Only owner)
router.delete("/:projectId", deleteProject);

// ADD MEMBER TO PROJECT (Only owner)
router.post("/:projectId/members", addMember);

module.exports = router;
