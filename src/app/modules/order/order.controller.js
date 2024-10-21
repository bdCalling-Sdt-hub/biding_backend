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
  const result = await orderService.getMyOrderFromDB(
    req?.user?.userId,
    req?.query
  );

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
const getMyBids = catchAsync(async (req, res) => {
  const result = await orderService.getMyBids(req?.user?.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your bid retrieved successfully successfully",
    data: result,
  });
});

const createFinanceOrder = catchAsync(async (req, res) => {
  const approvalUrl = await orderService.createFinanceOrder(
    req?.user?.userId,
    req?.body
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order created successfully",
    data: { approvalUrl },
  });
});
const approveFinanceOrder = catchAsync(async (req, res) => {
  const result = await orderService.approveFinanceOrder(req?.params?.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order approved successfully",
    data: result,
  });
});
const declineFinanceOrder = catchAsync(async (req, res) => {
  const result = await orderService.declineFinanceOrder(req?.params?.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order decline successfully",
    data: result,
  });
});
const makePaid = catchAsync(async (req, res) => {
  const result = await orderService.makePaid(req?.params?.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successfully make paid",
    data: result,
  });
});
const sendPaymentLink = catchAsync(async (req, res) => {
  const result = await orderService.sendPaymentLink(
    req?.params?.id,
    req?.body?.paymentLink
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successfully send payment link",
    data: result,
  });
});

const orderController = {
  getAllOrder,
  getMyOrder,
  getSingleOrder,
  changeOrderStatus,
  updateExpectedDeliveryDate,
  getMyBids,
  createFinanceOrder,
  approveFinanceOrder,
  declineFinanceOrder,
  makePaid,
  sendPaymentLink,
};

module.exports = orderController;
