const QueryBuilder = require("../../../builder/QueryBuilder");
const getAdminNotificationCount = require("../../../helpers/getAdminNotificationCount");
const getUnseenNotificationCount = require("../../../helpers/getUnseenNotification");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const Notification = require("./notification.model");

const getAllNotificationFromDB = async (query, user) => {
  if (user?.role === ENUM_USER_ROLE.ADMIN) {
    const notificationQuery = new QueryBuilder(
      Notification.find({ receiver: ENUM_USER_ROLE.ADMIN }),
      query
    )
      .search(["name"])
      .filter()
      .sort()
      .paginate()
      .fields();
    const result = await notificationQuery.modelQuery;
    const meta = await notificationQuery.countTotal();
    return { meta, result };
  } else {
    const notificationQuery = new QueryBuilder(
      Notification.find({ receiver: user?.userId }),
      query
    )
      .search(["name"])
      .filter()
      .sort()
      .paginate()
      .fields();
    const result = await notificationQuery.modelQuery;
    const meta = await notificationQuery.countTotal();
    return { meta, result };
  }
};

const seeNotification = async (user) => {
  let result;
  if (user?.role === ENUM_USER_ROLE.ADMIN) {
    result = await Notification.updateMany(
      { receiver: ENUM_USER_ROLE.ADMIN },
      { seen: true },
      { runValidators: true, new: true }
    );
    const adminUnseenNotificationCount = await getAdminNotificationCount();
    global.io.emit("admin-notifications", adminUnseenNotificationCount);
  }
  if (user?.role === ENUM_USER_ROLE.USER) {
    result = await Notification.updateMany(
      { receiver: user?.userId },
      { seen: true },
      { runValidators: true, new: true }
    );
  }
  const updatedNotificationCount = await getUnseenNotificationCount(
    user?.userId
  );
  global.io.to(user?.userId).emit("notifications", updatedNotificationCount);
  return result;
};

const notificationService = {
  getAllNotificationFromDB,
  seeNotification,
};

module.exports = notificationService;
