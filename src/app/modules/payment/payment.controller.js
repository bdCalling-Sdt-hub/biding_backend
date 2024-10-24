const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const PaymentService = require("../payment/payment.service");

const makePaymentWithCreditCard = catchAsync(async (req, res) => {
  // const { item, quantity, amount, token, type } = req?.body;
  // const user = req?.user;

  // const { charge, customerId: newCustomerId } =
  //   await PaymentService.makePaymentWithCreditCard(
  //     user,
  //     item,
  //     quantity,
  //     amount,
  //     token,
  //     type
  //   );

  const result = await PaymentService.makePaymentWithCreditCard(
    req?.body,
    req?.user?.userId
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payment successfully",
    // data: charge,
    data: result,
  });
});

// create payment with paypal
const createPaymentWithPaypal = catchAsync(async (req, res) => {
  const { amount, orderDetails } = req.body;
  const approvalUrl = await PaymentService.createPaymentWithPaypal(
    req?.user?.userId,
    amount,
    orderDetails
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "PayPal payment created successfully",
    data: { approvalUrl },
  });
});

// execute payment with paypal
// const executePaymentWithPaypal = catchAsync(async (req, res) => {
//   const { paymentId, payerId, orderDetails } = req.body; // Include orderDetails
//   const paymentResult = await PaymentService.executePaymentWithPaypal(
//     req?.user?.userId,
//     paymentId,
//     payerId,
//     orderDetails
//   );

//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Payment executed successfully",
//     data: paymentResult,
//   });
// });
const executePaymentWithPaypal = catchAsync(async (req, res) => {
  const { paymentId, payerID } = req.body; // Include orderDetails
  const paymentResult = await PaymentService.executePaymentWithPaypal(
    req?.user?.userId,
    paymentId,
    payerID
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment executed successfully",
    data: paymentResult,
  });
});

const executePaymentWithCreditCard = catchAsync(async (req, res) => {
  const result = await PaymentService.executePaymentWithCreditCard(
    req?.body?.paymentId,
    req?.user?.userId
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment executed successfully",
    data: result,
  });
});

const createPaymentIntent = catchAsync(async (req, res) => {
  // console.log(req.user);
  const result = await PaymentService.createPaymentIntent(
    req?.body,
    req?.user?.userId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment intent created successfully",
    data: result,
  });
});

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
  createPaymentIntent,
  executePaymentWithCreditCard,
};

module.exports = PaymentController;
