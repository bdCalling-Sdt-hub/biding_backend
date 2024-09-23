const notificationService = require("./notification.service");

const getAllNotification = catchAsync(async (req, res) => {
  const result = await notificationService.getAllNotificationFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});

const notificationController = {
  getAllNotification,
};

module.exports = notificationController;
