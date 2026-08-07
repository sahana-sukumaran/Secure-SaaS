const Task = require("../models/Task");
const Project = require("../models/Project");
const { logActivity } = require("../utils/activityLogger");
const createNotification = require("../utils/notificationService");
const { createCommentPayload, canDeleteComment } = require("../utils/taskCommentPermissions");
const { getTaskPriority } = require("../services/aiPriorityService");
// CREATE TASK
// CREATE TASK
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Task title required",
      });
    }

    // Check if project exists
    const project = await Project.findOne({
      _id: projectId,
      tenantId: req.user.tenantId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Check membership
    const isMember =
      project.owner.equals(req.user.id) ||
      project.members.some((m) => m.user.equals(req.user.id));

    if (!isMember) {
      return res.status(403).json({
        message: "Not a member of this project",
      });
    }

    // ==========================
    // AI PRIORITY GENERATION
    // ==========================

    const aiResult = await getTaskPriority({
      title,
      description,
    });

    // ==========================
    // CREATE TASK
    // ==========================

   const task = await Task.create({
  tenantId: req.user.tenantId,
  title,
  description,
  project: projectId,
  createdBy: req.user.id,
  assignedTo,
  priority: aiResult.priority,
aiEstimatedTime: aiResult.estimated_time,
aiReason: aiResult.reason,
dueDate,
});

    await task.populate("createdBy", "name email");
    await task.populate("assignedTo", "name email");
    await task.populate("comments.author", "name email");

    // Activity Log
    await logActivity(
      req.user.id,
      "CREATE_TASK",
      "Task",
      task._id,
      {
        tenantId: req.user.tenantId,
        details: `Created task: ${title}`,
      }
    );

    // Notification
    if (assignedTo) {
      await createNotification({
        tenantId: req.user.tenantId,
        user: assignedTo,
        message: `You have been assigned the task "${title}"`,
        type: "TASK_ASSIGNED",
        project: projectId,
        task: task._id,
      });
    }

    // Return AI information WITHOUT storing it
    res.status(201).json({
      message: "Task created successfully",

      aiSuggestion: {
        priority: aiResult.priority,
        estimated_time: aiResult.estimated_time,
        reason: aiResult.reason,
      },

      task,
    });

  } catch (err) {
    err.statusCode = 500;
    err.message = "Error creating task";
    next(err);
  }
};
// GET TASKS FOR PROJECT
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check if user is member of project
    const project = await Project.findOne({ _id: projectId, tenantId: req.user.tenantId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.owner.equals(req.user.id) ||
      project.members.some(m => m.user.equals(req.user.id));

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const tasks = await Task.find({ project: projectId, tenantId: req.user.tenantId })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("comments.author", "name email");

    res.json({
      message: "Tasks retrieved",
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching tasks";
    next(err);
  }
};

// UPDATE TASK (Creator or assigned person)
exports.updateTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const task = await Task.findOne({ _id: taskId, tenantId: req.user.tenantId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user is creator or assigned
    if (!task.createdBy.equals(req.user.id) && !task.assignedTo?.equals(req.user.id)) {
      return res.status(403).json({ message: "You can only update your own tasks" });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = dueDate;

    await task.save();
    await task.populate("createdBy", "name email");
    await task.populate("assignedTo", "name email");
    await task.populate("comments.author", "name email");

    // Log activity
    await logActivity(req.user.id, "UPDATE_TASK", "Task", task._id, {
      tenantId: req.user.tenantId,
      details: `Updated task: ${task.title}`,
    });
    // Notify task creator when task is completed
if (status === "completed") {
  await createNotification({
    tenantId: req.user.tenantId,
    user: task.createdBy,
    message: `Task "${task.title}" has been marked as completed.`,
    type: "TASK_COMPLETED",
    project: projectId,
    task: task._id,
  });
}

    res.json({ message: "Task updated", task });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error updating task";
    next(err);
  }
};

// DELETE TASK (Only creator)
exports.deleteTask = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, tenantId: req.user.tenantId });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.createdBy.equals(req.user.id)) {
      return res.status(403).json({ message: "Only creator can delete task" });
    }

    // ✅ Log ONLY after authorization
    await logActivity(req.user.id, "DELETE_TASK", "Task", taskId, {
      tenantId: req.user.tenantId,
      details: `Deleted task`,
    });

    await Task.findOneAndDelete({ _id: taskId, tenantId: req.user.tenantId });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error deleting task";
    next(err);
  }
};

// ADD COMMENT TO TASK
exports.addComment = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text required" });
    }

    const project = await Project.findOne({ _id: projectId, tenantId: req.user.tenantId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.owner.equals(req.user.id) ||
      project.members.some((member) => member.user.equals(req.user.id));

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const task = await Task.findOne({ _id: taskId, project: projectId, tenantId: req.user.tenantId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const commentPayload = createCommentPayload({ text }, req.user);
    task.comments.push(commentPayload);
    await task.save();

    await task.populate("createdBy", "name email");
    await task.populate("assignedTo", "name email");
    await task.populate("comments.author", "name email");

    const newComment = task.comments[task.comments.length - 1];

    await logActivity(req.user.id, "ADD_TASK_COMMENT", "Task", task._id, {
      tenantId: req.user.tenantId,
      details: `Added comment to task: ${task.title}`,
    });

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
      task,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error adding comment";
    next(err);
  }
};

// GET COMMENTS FOR TASK
exports.getTaskComments = async (req, res, next) => {
  try {
    const { projectId, taskId } = req.params;

    const project = await Project.findOne({ _id: projectId, tenantId: req.user.tenantId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.owner.equals(req.user.id) ||
      project.members.some((member) => member.user.equals(req.user.id));

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const task = await Task.findOne({ _id: taskId, project: projectId, tenantId: req.user.tenantId })
      .populate("comments.author", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({
      message: "Comments retrieved",
      count: task.comments.length,
      comments: task.comments,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching comments";
    next(err);
  }
};

// DELETE COMMENT FROM TASK
exports.deleteComment = async (req, res, next) => {
  try {
    const { projectId, taskId, commentId } = req.params;

    const project = await Project.findOne({ _id: projectId, tenantId: req.user.tenantId });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.owner.equals(req.user.id) ||
      project.members.some((member) => member.user.equals(req.user.id));

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const task = await Task.findOne({ _id: taskId, project: projectId, tenantId: req.user.tenantId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!canDeleteComment(req.user, comment)) {
      return res.status(403).json({ message: "Only the author or an admin can delete this comment" });
    }

    task.comments.pull(commentId);
    await task.save();
    await task.populate("comments.author", "name email");

    await logActivity(req.user.id, "DELETE_TASK_COMMENT", "Task", task._id, {
      tenantId: req.user.tenantId,
      details: `Deleted a comment from task: ${task.title}`,
    });

    res.json({
      message: "Comment deleted successfully",
      comments: task.comments,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error deleting comment";
    next(err);
  }
};
// GET ALL TASKS FOR TENANT
exports.getAllTasks = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = {
      tenantId: req.user.tenantId,
    };

    if (status === "completed") {
      filter.status = "completed";
    } else if (status === "pending") {
      filter.status = { $ne: "completed" };
    }

    const tasks = await Task.find(filter)
      .populate("project", "name")
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: "Tasks retrieved",
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching all tasks";
    next(err);
  }
};
