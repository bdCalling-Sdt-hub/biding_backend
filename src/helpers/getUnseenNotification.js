const Notification = require("../app/modules/notification/notification.model");

const getUnseenNotificationCount = async (receiver) => {
  const unseenCount = await Notification.countDocuments({
    seen: false,
    receiver: receiver,
  });
  const notifications = await Notification.find({ receiver: receiver });
  return { unseenCount, notifications: notifications };
};

module.exports = getUnseenNotificationCount;
