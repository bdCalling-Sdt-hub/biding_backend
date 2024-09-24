const Notification = require("../app/modules/notification/notification.model");
const getUnseenNotificationCount = require("../helpers/getUnseenNotification");

const handleNotification = async (io, socket) => {
  const unseenNotificationCount = await getUnseenNotificationCount();
  socket.emit("notifications", unseenNotificationCount);
  // see notification
  socket.on("seen-notification", async () => {
    const updateNotification = await Notification.updateMany(
      { seen: false },
      { $set: { seen: true } }
    );
    const updatedNotificationCount = await Notification.countDocuments({
      seen: false,
    });
    socket.emit("notifications", updatedNotificationCount);
  });
};

module.exports = handleNotification;
