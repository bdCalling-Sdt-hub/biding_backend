const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const notificationService = require("./notification.service");

const getAllNotification = catchAsync(async (req, res) => {
  const result = await notificationService.getAllNotificationFromDB(
    req?.query,
    req?.user
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});

const seeNotification = catchAsync(async (req, res) => {
  const result = await notificationService.seeNotification(req?.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification seen successfully",
    data: result,
  });
});

const notificationController = {
  getAllNotification,
  seeNotification,
};

module.exports = notificationController;
