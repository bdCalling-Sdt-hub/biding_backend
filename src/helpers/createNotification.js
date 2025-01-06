const Notification = require("../app/modules/notification/notification.model");

const createNotification = async (notificationData) => {
  const result = await Notification.create(notificationData);
  return result;
};

module.exports = createNotification;
