const Notification = require("../app/modules/notification/notification.model");

const createNotification = async (message) => {
  const result = await Notification.create({ message });
  return result;
};

module.exports = createNotification;
