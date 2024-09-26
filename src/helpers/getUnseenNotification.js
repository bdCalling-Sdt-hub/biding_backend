const Notification = require("../app/modules/notification/notification.model");

const getUnseenNotificationCount = async (receiver) => {
  const result = await Notification.countDocuments({
    seen: false,
    receiver: receiver,
  });
  return result;
};

module.exports = getUnseenNotificationCount;
