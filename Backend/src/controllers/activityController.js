const ActivityLog = require("../models/ActivityLog");

// GET ACTIVITY LOGS (Admin only - all activities)
exports.getAllActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, resource } = req.query;

    let filter = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    const activities = await ActivityLog.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      message: "Activity logs retrieved",
      total,
      page,
      pages: Math.ceil(total / limit),
      activities,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching logs";
    next(err);
  }
};

// GET USER'S OWN ACTIVITY LOG
exports.getUserActivityLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, resource } = req.query;

    let filter = { user: req.user.id };
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    const activities = await ActivityLog.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      message: "Your activity logs",
      total,
      page,
      pages: Math.ceil(total / limit),
      activities,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching logs";
    next(err);
  }
};

// GET ACTIVITY LOG FOR SPECIFIC RESOURCE (Project, Task, etc.)
exports.getResourceActivityLog = async (req, res, next) => {
  try {
    const { resource, resourceId } = req.params;

    const activities = await ActivityLog.find({
      resource,
      resourceId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      message: `Activity logs for ${resource}`,
      count: activities.length,
      activities,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching logs";
    next(err);
  }
};

// GET ACTIVITY STATISTICS (Admin dashboard)
exports.getActivityStats = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const totalActivities = await ActivityLog.countDocuments({
      createdAt: { $gte: startDate },
    });

    res.json({
      message: `Activity statistics for last ${days} days`,
      totalActivities,
      byAction: stats,
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = "Error fetching stats";
    next(err);
  }
};
