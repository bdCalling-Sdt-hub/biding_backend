const Notification = require("../app/modules/notification/notification.model");

const getUnseenNotificationCount = async () => {
  const result = await Notification.countDocuments({ seen: false });
  return result;
};

module.exports = getUnseenNotificationCount;
