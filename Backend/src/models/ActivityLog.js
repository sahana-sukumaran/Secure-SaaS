const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      // Examples: "CREATE_PROJECT", "UPDATE_TASK", "DELETE_PROJECT", "LOGIN", "ADD_MEMBER"
    },
    resource: {
      type: String,
      // Examples: "Project", "Task", "User"
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
      // Human-readable description of what happened
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
  },
  { timestamps: true }
);

// Index for efficient querying
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ resource: 1, resourceId: 1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
