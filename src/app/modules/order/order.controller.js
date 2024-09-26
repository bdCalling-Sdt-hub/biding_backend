const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const orderService = require("./order.service");

// get all order
const getAllOrder = catchAsync(async (req, res) => {
  const result = await orderService.getAllOrderFromDB(req?.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order retrieved successfully",
    data: result,
  });
});

// get single order
const getSingleOrder = catchAsync(async (req, res) => {
  const result = await orderService.getSingleOrder(req?.params?.id);

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

// change order status
const changeOrderStatus = catchAsync(async (req, res) => {
  const result = await orderService.changeOrderStatusIntoDB(
    req?.params?.id,
    req?.body?.status
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order status updated successfully",
    data: result,
  });
});

//update delivery date
const updateExpectedDeliveryDate = catchAsync(async (req, res) => {
  const result = await orderService.updateExpectedDeliveryDateIntoDB(
    req?.params?.id,
    req?.body?.date
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Expected delivery date updated successfully",
    data: result,
  });
});

const orderController = {
  getAllOrder,
  getMyOrder,
  getSingleOrder,
  changeOrderStatus,
  updateExpectedDeliveryDate,
};

module.exports = orderController;
