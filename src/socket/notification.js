const Notification = require("../app/modules/notification/notification.model");

const handleNotification = async (io, socket) => {
  const notifications = await Notification.find({ seen: false });
  socket.emit("notifications", notifications);
  // see notification
  socket.on("seen-notification", async () => {
    const updateNotification = await Notification.updateMany(
      { seen: false },
      { $set: { seen: true } }
    );
    const updatedNotifications = await Notification.find({ seen: false });
    socket.emit("notifications", updatedNotifications);
  });
};

module.exports = handleNotification;
