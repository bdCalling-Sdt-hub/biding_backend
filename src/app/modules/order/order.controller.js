const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const orderService = require("./order.service");

// get all order
const getAllOrder = catchAsync(async (req, res) => {
  const result = await orderService.getAllOrderFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order retrieved successfully",
    data: result,
  });
});

// get my orders
const getMyOrder = catchAsync(async (req, res) => {
  const result = await orderService.getMyOrderFromDB(req?.user?.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order retrieved successfully",
    data: result,
  });
});
const orderController = {
  getAllOrder,
  getMyOrder,
};

module.exports = orderController;
