const Task = require("../models/Task");
const Project = require("../models/Project");
const { logActivity } = require("../utils/activityLogger");

// CREATE TASK
exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Task title required" });
    }

    // Check if project exists and user is member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.owner.equals(req.user.id) ||
      project.members.some(m => m.user.equals(req.user.id));

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      createdBy: req.user.id,
      assignedTo,
      priority,
      dueDate,
    });

    await task.populate("createdBy", "name email");
    await task.populate("assignedTo", "name email");

    // Log activity
    await logActivity(req.user.id, "CREATE_TASK", "Task", task._id, {
      details: `Created task: ${title}`,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (err) {
    res.status(500).json({ message: "Error creating task", error: err.message });
  }
};

// GET TASKS FOR PROJECT
exports.getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if user is member of project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.owner.equals(req.user.id) ||
      project.members.some(m => m.user.equals(req.user.id));

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this project" });
    }

    const tasks = await Task.find({ project: projectId })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    res.json({
      message: "Tasks retrieved",
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks", error: err.message });
  }
};

// UPDATE TASK (Creator or assigned person)
exports.updateTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    const task = await Task.findById(taskId);

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

    // Log activity
    await logActivity(req.user.id, "UPDATE_TASK", "Task", task._id, {
      details: `Updated task: ${task.title}`,
    });

    res.json({ message: "Task updated", task });
  } catch (err) {
    res.status(500).json({ message: "Error updating task", error: err.message });
  }
};

// DELETE TASK (Only creator)
exports.deleteTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.createdBy.equals(req.user.id)) {
    // Log activity
    await logActivity(req.user.id, "DELETE_TASK", "Task", taskId, {
      details: `Deleted task`,
    });

      return res.status(403).json({ message: "Only creator can delete task" });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task", error: err.message });
  }
};
