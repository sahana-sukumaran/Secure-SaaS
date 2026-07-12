const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");

// GET DASHBOARD STATISTICS
exports.getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const [projects, tasks, completed, pending, members] = await Promise.all([
      Project.countDocuments({ tenantId }),
      Task.countDocuments({ tenantId }),
      Task.countDocuments({
        tenantId,
        status: "completed",
      }),
      Task.countDocuments({
        tenantId,
        status: { $ne: "completed" },
      }),
      User.countDocuments({ tenantId }),
    ]);

    res.json({
      message: "Dashboard statistics retrieved",
      stats: {
        projects,
        tasks,
        completed,
        pending,
        members,
      },
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching dashboard statistics";
    next(err);
  }
};