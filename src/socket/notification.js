const Notification = require("../app/modules/notification/notification.model");
const getAdminNotificationCount = require("../helpers/getAdminNotificationCount");
const getUnseenNotificationCount = require("../helpers/getUnseenNotification");
const { ENUM_USER_ROLE } = require("../utils/enums");

const handleNotification = async (currentUserId, io, socket) => {
  const unseenNotificationCount = await getUnseenNotificationCount(
    currentUserId
  );
  socket.emit("notifications", unseenNotificationCount);
  const adminUnseenNotificationCount = await getAdminNotificationCount();
  socket.emit("admin-notifications", adminUnseenNotificationCount);
  // see notification
  socket.on("seen-notification", async (receiver) => {
    const updateNotification = await Notification.updateMany(
      { receiver },
      { $set: { seen: true } }
    );
    const updatedNotificationCount = await Notification.countDocuments({
      seen: false,
      receiver: receiver,
    });
    // socket.emit("notifications", updatedNotificationCount);
    io.to(receiver).emit("notifications", updatedNotificationCount);
  });

  // see admin notification
  socket.on("seen-admin-notification", async () => {
    const updateNotification = await Notification.updateMany(
      {
        receiver: ENUM_USER_ROLE.ADMIN,
      },
      { $set: { seen: true } }
    );
    const updatedNotificationCount = await Notification.countDocuments({
      seen: false,
      receiver: ENUM_USER_ROLE.ADMIN,
    });
    socket.emit("admin-notifications", updatedNotificationCount);
  });
};

module.exports = handleNotification;
