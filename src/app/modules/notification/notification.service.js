const QueryBuilder = require("../../../builder/QueryBuilder");
const Notification = require("./notification.model");

const getAllNotificationFromDB = async (query) => {
  const notificationQuery = new QueryBuilder(Notification.find(), query)
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await notificationQuery.modelQuery;
  const meta = await notificationQuery.countTotal();
  return { meta, result };
};

const notificationService = {
  getAllNotificationFromDB,
};

module.exports = notificationService;
