const Notification = require("../models/Notification");

const createNotification = async ({
  tenantId,
  user,
  message,
  type,
  project = null,
  task = null,
}) => {
  try {
    const notification = new Notification({
      tenantId,
      user,
      message,
      type,
      project,
      task,
    });

    await notification.save();

    return notification;
  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

module.exports = createNotification;