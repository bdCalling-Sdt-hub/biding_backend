const Notification = require("../app/modules/notification/notification.model");
const { ENUM_USER_ROLE } = require("../utils/enums");

const getAdminNotificationCount = async () => {
  const result = await Notification.countDocuments({
    seen: false,
    receiver: ENUM_USER_ROLE.ADMIN,
  });
  return result;
};

module.exports = getAdminNotificationCount;
