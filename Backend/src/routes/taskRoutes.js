const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createTask,
  getProjectTasks,
  getAllTasks,
  updateTask,
  deleteTask,
  addComment,
  getTaskComments,
  deleteComment,
} = require("../controllers/taskController");

// All routes require authentication
router.use(protect);
router.get("/tasks", getAllTasks);
// CREATE TASK
router.post("/:projectId/tasks", createTask);

// GET TASKS FOR PROJECT
router.get("/:projectId/tasks", getProjectTasks);

// UPDATE TASK
router.put("/:projectId/tasks/:taskId", updateTask);

// DELETE TASK
router.delete("/:projectId/tasks/:taskId", deleteTask);

// ADD COMMENT TO TASK
router.post("/:projectId/tasks/:taskId/comments", addComment);

// GET COMMENTS FOR TASK
router.get("/:projectId/tasks/:taskId/comments", getTaskComments);

// DELETE COMMENT FROM TASK
router.delete("/:projectId/tasks/:taskId/comments/:commentId", deleteComment);

module.exports = router;
