const Notification = require("../app/modules/notification/notification.model");

const getUnseenNotification = async () => {
  const result = await Notification.find({ seen: false });
  return result;
};

module.exports = getUnseenNotification;
