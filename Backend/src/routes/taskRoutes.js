const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

// All routes require authentication
router.use(protect);

// CREATE TASK
router.post("/:projectId/tasks", createTask);

// GET TASKS FOR PROJECT
router.get("/:projectId/tasks", getProjectTasks);

// UPDATE TASK
router.put("/:projectId/tasks/:taskId", updateTask);

// DELETE TASK
router.delete("/:projectId/tasks/:taskId", deleteTask);

module.exports = router;
