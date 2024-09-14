const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const PaymentService = require("../payment/payment.service");

const createPaymentIntent = catchAsync(async (req, res) => {
  console.log(req.user);
  const result = await PaymentService.createPaymentIntent(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment intent created successfully",
    data: result,
  });
});

const savePaymentUpdateSpending = catchAsync(async (req, res) => {
  const result = await PaymentService.savePaymentUpdateSpending(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "You payment is saved. Total spend amount updated successfully",
    data: result,
  });
});

const updateTotalEarning = catchAsync(async (req, res) => {
  const result = await PaymentService.updateTotalEarning(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment saved. Total earning amount updated successfully",
    data: result,
  });
});

const allPayments = catchAsync(async (req, res) => {
  const result = await PaymentService.allPayments();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Total earning amount updated successfully",
    data: result,
  });
});

const PaymentController = {
  createPaymentIntent,
  savePaymentUpdateSpending,
  updateTotalEarning,
  allPayments,
};

module.exports = PaymentController;
