const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const PaymentService = require("../payment/payment.service");

const makePaymentWithCreditCard = catchAsync(async (req, res) => {
  const { item, quantity, amount, token, type } = req?.body;
  const user = req?.user;

  const { charge, customerId: newCustomerId } =
    await PaymentService.makePaymentWithCreditCard(
      user,
      item,
      quantity,
      amount,
      token,
      type
    );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payment successfully",
    data: charge,
  });
});

// create payment with paypal
const createPaymentWithPaypal = catchAsync(async (req, res) => {
  const { amount, productName } = req.body;
  const approvalUrl = await PaymentService.createPaymentWithPaypal(
    amount,
    productName
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "PayPal payment created successfully",
    data: { approvalUrl },
  });
});

// execute payment with paypal
const executePaymentWithPaypal = catchAsync(async (req, res) => {
  const { paymentId, payerId, orderDetails } = req.body; // Include orderDetails
  const paymentResult = await PaymentService.executePaymentWithPaypal(
    paymentId,
    payerId,
    orderDetails
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment executed successfully",
    data: paymentResult,
  });
});

// const createPaymentIntent = catchAsync(async (req, res) => {
//   console.log(req.user);
//   const result = await PaymentService.createPaymentIntent(req.body);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Payment intent created successfully",
//     data: result,
//   });
// });

// const savePaymentUpdateSpending = catchAsync(async (req, res) => {
//   const result = await PaymentService.savePaymentUpdateSpending(req.body);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "You payment is saved. Total spend amount updated successfully",
//     data: result,
//   });
// });

// const updateTotalEarning = catchAsync(async (req, res) => {
//   const result = await PaymentService.updateTotalEarning(req.body);

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Payment saved. Total earning amount updated successfully",
//     data: result,
//   });
// });

// const allPayments = catchAsync(async (req, res) => {
//   const result = await PaymentService.allPayments();

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Total earning amount updated successfully",
//     data: result,
//   });
// });

const PaymentController = {
  // createPaymentIntent,
  // savePaymentUpdateSpending,
  // updateTotalEarning,
  // allPayments,
  makePaymentWithCreditCard,
  createPaymentWithPaypal,
  executePaymentWithPaypal,
};

module.exports = PaymentController;
