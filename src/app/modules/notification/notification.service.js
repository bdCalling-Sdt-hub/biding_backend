const QueryBuilder = require("../../../builder/QueryBuilder");
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

const notificationService = {
  getAllNotificationFromDB,
};

module.exports = notificationService;
