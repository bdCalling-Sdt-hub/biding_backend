const Notification = require("../app/modules/notification/notification.model");
const { ENUM_USER_ROLE } = require("../utils/enums");

const getAdminNotificationCount = async () => {
  const unseenCount = await Notification.countDocuments({
    seen: false,
    receiver: ENUM_USER_ROLE.ADMIN,
  });
  const notifications = await Notification.find({
    receiver: ENUM_USER_ROLE.ADMIN,
  });
  return { notifications, unseenCount };
};

module.exports = getAdminNotificationCount;
