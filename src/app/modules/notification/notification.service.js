const Notification = require("./notification.model");

const getAllNotificationFromDB = async () => {
  const result = await Notification.find();

  return result;
};

const notificationService = {
  getAllNotificationFromDB,
};

module.exports = notificationService;
