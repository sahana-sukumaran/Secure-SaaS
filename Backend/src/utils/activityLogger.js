const ActivityLog = require("../models/ActivityLog");

/**
 * Log user activity
 * @param {string} userId - User ID
 * @param {string} action - Action type (e.g., "CREATE_PROJECT")
 * @param {string} resource - Resource type (e.g., "Project")
 * @param {string} resourceId - ID of the resource
 * @param {object} options - Additional options
 */
const logActivity = async (userId, action, resource, resourceId, options = {}) => {
  try {
    const activityLog = await ActivityLog.create({
      user: userId,
      action,
      resource,
      resourceId,
      details: options.details || "",
      changes: options.changes || null,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      status: options.status || "success",
    });

    return activityLog;
  } catch (err) {
    console.error("Error logging activity:", err);
  }
};

module.exports = { logActivity };
