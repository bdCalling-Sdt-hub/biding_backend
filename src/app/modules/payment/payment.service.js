const httpStatus = require("http-status");
const config = require("../../../config");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const { Transaction } = require("./payment.model");
const stripe = require("stripe")(config.stripe.stripe_secret_key);
const paypal = require("paypal-rest-sdk");
const Order = require("../order/order.model");
const {
  ENUM_PAID_BY,
  ENUM_DELIVERY_STATUS,
  ENUM_PAYMENT_STATUS,
  ENUM_USER_ROLE,
} = require("../../../utils/enums");
const getUnseenNotificationCount = require("../../../helpers/getUnseenNotification");
const { default: mongoose } = require("mongoose");
const getAdminNotificationCount = require("../../../helpers/getAdminNotificationCount");
const Notification = require("../notification/notification.model");
const Auction = require("../auction/auction.model");

// PayPal configuration
paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});
const makePaymentWithCreditCard = async (
  userData,
  item,
  quantity,
  amount,
  token,
  type
) => {
  let customer;

  const user = await User.findById(userData?.userId);
  const email = user?.email;
  // if (existingCustomerId) {
  //   // If customer already exists, reuse the customer
  //   customer = await stripe.customers.retrieve(existingCustomerId);
  // } else {
  //   // Create a new customer if none exists
  //   customer = await stripe.customers.create({
  //     email,
  //     source: token.id,
  //     name: token.card.name,
  //   });
  // }
  if (user?.stripCustomerId) {
    customer = await stripe.customers.retrieve(stripCustomerId);
    const existingCards = customer.sources.data;

    const newCard = {
      last4: token.card.last4,
      brand: token.card.brand,
      exp_month: token.card.exp_month,
      exp_year: token.card.exp_year,
    };

    const cardExists = existingCards.some(
      (card) =>
        card.last4 === newCard.last4 &&
        card.brand === newCard.brand &&
        card.exp_month === newCard.exp_month &&
        card.exp_year === newCard.exp_year
    );

    if (!cardExists) {
      customer = await stripe.customers.create({
        email,
        source: token.id,
        name: token.card.name,
      });
    }
  } else {
    // Create a new customer with the new card
    customer = await stripe.customers.create({
      email,
      source: token.id,
      name: token.card.name,
    });

    // saveCustomerId(customer.id);
  }
  // Make the charge to the customer
  const charge = await stripe.charges.create({
    amount: parseFloat(amount) * 100,
    description: `Payment for USD ${amount}`,
    currency: "USD",
    customer: customer.id,
  });

  await User.findByIdAndUpdate(user?.userId, { stripCustomerId: customer?.id });

  return { charge, customerId: customer.id };
};

// make payment with credit card --------------------------

// const makePaymentWithCreditCard = async (payload, userId) => {
//   console.log("this is from make paymetn with credit card");
//   const { cardDetails, orderDetails } = payload;

//   const { cardNumber, expMonth, expYear, cvc } = cardDetails;

//   const { totalAmount, shippingAddress, item, itemType, winingBid, product } =
//     orderDetails;
//   console.log(cardDetails, orderDetails);

//   // 1. Create a Stripe token using the card details provided
//   const token = await stripe.tokens.create({
//     card: {
//       number: cardNumber,
//       exp_month: expMonth,
//       exp_year: expYear,
//       cvc: cvc,
//     },
//   });

//   // 2. Create a Stripe Payment Intent to charge the customer
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: totalAmount * 100,
//     currency: "usd",
//     payment_method_data: {
//       type: "card",
//       card: {
//         token: token.id,
//       },
//     },
//     confirm: true,
//   });

//   //  if the payment is successful, create the order and transaction
//   if (paymentIntent.status === "succeeded") {
//     let order;
//     if (orderDetails?.shippingAddress) {
//       const orderData = {
//         user: userId,
//         shippingAddress: shippingAddress,
//         winingBid: winingBid,
//         totalAmount: totalAmount,
//         paidBy: ENUM_PAID_BY.CREDIT_CARD,
//         item: product,
//         status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
//         statusWithTime: [
//           {
//             status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
//             time: new Date(),
//           },
//         ],
//         paymentId: paymentIntent.id,
//       };
//       order = await Order.create(orderData);
//     }

//     // 5. Create a new transaction
//     const transactionData = {
//       user: userId,
//       item: item,
//       paymentStatus: ENUM_PAYMENT_STATUS.PAID,
//       paidAmount: totalAmount,
//       itemType: itemType,
//       paymentType: "Online Payment",
//       paymentId: paymentIntent.id,
//     };

//     const transaction = await Transaction.create(transactionData);

//     return { order, transaction };
//   } else {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Payment failed. Please try again."
//     );
//   }
// };

const createPaymentIntent = async (orderDetails, userId) => {
  const { totalAmount, shippingAddress, item, itemType, winingBid, product } =
    orderDetails;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100,
    currency: "usd",
    payment_method_types: ["card"],
  });

  let order;
  if (orderDetails?.shippingAddress) {
    const orderData = {
      user: userId,
      shippingAddress: shippingAddress,
      winingBid: winingBid,
      totalAmount: totalAmount,
      paidBy: ENUM_PAID_BY.CREDIT_CARD,
      item: product,
      status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
      statusWithTime: [
        {
          status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
          time: new Date(),
        },
      ],
      paymentId: paymentIntent.id,
    };
    order = await Order.create(orderData);
  }

  // 5. Create a new transaction
  const transactionData = {
    user: userId,
    item: item,
    paymentStatus: ENUM_PAYMENT_STATUS.UNPAID,
    paidAmount: totalAmount,
    itemType: itemType,
    paymentType: "Online Payment",
    paymentId: paymentIntent.id,
    transactionId: paymentIntent.id,
  };

  await Transaction.create(transactionData);

  return {
    clientSecret: paymentIntent.client_secret,
  };
};

// const createPaymentIntent = async (amount) => {
//   // Create a PaymentIntent with the specified amount and currency
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: amount * 100,
//     currency: "usd",
//     payment_method_types: ["card"],
//   });

//   console.log(paymentIntent);

//   return {
//     clientSecret: paymentIntent.client_secret,
//   };
// };

// Create PayPal payment
// const createPaymentWithPaypal = async (amount, productName) => {
//   console.log(amount, productName);
//   const create_payment_json = {
//     intent: "sale",
//     payer: { payment_method: "paypal" },
//     redirect_urls: {
//       return_url: process.env.PAYPAL_SUCCESS_URL,
//       cancel_url: process.env.PAYPAL_CANCEL_URL,
//     },
//     transactions: [
//       {
//         item_list: {
//           items: [
//             {
//               name: productName,
//               // name: "Item",
//               // sku: "item",
//               price: amount,
//               currency: "USD",
//               quantity: 1,
//             },
//           ],
//         },
//         amount: { currency: "USD", total: amount },
//         description: "Payment for your order.",
//       },
//     ],
//   };

//   return new Promise((resolve, reject) => {
//     paypal.payment.create(create_payment_json, (error, payment) => {
//       if (error) {
//         reject(error);
//       } else {
//         const approvalUrl = payment.links.find(
//           (link) => link.rel === "approval_url"
//         ).href;
//         resolve(approvalUrl);
//       }
//     });
//   });
// };

// const createPaymentWithPaypal = async (
//   userId,
//   amount,
//   productName,
//   orderDetails
// ) => {
//   console.log(amount, orderDetails);
//   const create_payment_json = {
//     intent: "sale",
//     payer: { payment_method: "paypal" },
//     redirect_urls: {
//       return_url: process.env.PAYPAL_SUCCESS_URL,
//       cancel_url: process.env.PAYPAL_CANCEL_URL,
//     },
//     transactions: [
//       {
//         item_list: {
//           items: [
//             {
//               name: orderDetails?.item,
//               price: amount,
//               currency: "USD",
//               quantity: 1,
//             },
//           ],
//         },
//         amount: { currency: "USD", total: amount },
//         description: "Payment for your order.",
//       },
//     ],
//   };

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Create PayPal payment and get paymentId
//     const payment = await new Promise((resolve, reject) => {
//       paypal.payment.create(create_payment_json, (error, payment) => {
//         if (error) {
//           reject(error);
//         } else {
//           const approvalUrl = payment.links.find(
//             (link) => link.rel === "approval_url"
//           ).href;
//           resolve({ approvalUrl, paymentId: payment.id });
//         }
//       });
//     });

//     let order = null;

//     // Create the order with the paymentId
//     if (orderDetails?.shippingAddress) {
//       const orderData = {
//         user: userId,
//         shippingAddress: orderDetails?.shippingAddress,
//         winingBid: orderDetails?.winingBid,
//         paidBy: ENUM_PAID_BY.PAYPAL,
//         item: orderDetails?.item,
//         status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
//         statusWithTime: [
//           {
//             status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
//             time: new Date(),
//           },
//         ],
//         paymentId: payment.paymentId,
//       };
//       order = await Order.create([orderData], { session });
//       if (!order) {
//         throw new ApiError(
//           httpStatus.SERVICE_UNAVAILABLE,
//           "Order not created successfully."
//         );
//       }
//     }

//     // Create the transaction with the paymentId
//     const transactionData = {
//       user: userId,
//       item: orderDetails?.item,
//       paymentStatus: ENUM_PAYMENT_STATUS.UNPAID,
//       paidAmount: orderDetails?.totalAmount,
//       itemType: orderDetails?.itemType,
//       paymentType: "Online Payment",
//       paymentId: payment.paymentId,
//     };

//     const transaction = await Transaction.create([transactionData], {
//       session,
//     });
//     if (!transaction) {
//       throw new ApiError(
//         httpStatus.SERVICE_UNAVAILABLE,
//         "Transaction not created successfully."
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     return {
//       paymentId: payment.paymentId,
//       approvalUrl: payment.approvalUrl,
//       order,
//       transaction,
//     };
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     if (err instanceof ApiError) {
//       throw err;
//     }
//     throw new ApiError(
//       httpStatus.SERVICE_UNAVAILABLE,
//       "Something went wrong. Try again later."
//     );
//   }
// };
const createPaymentWithPaypal = async (userId, amount, orderDetails) => {
  const isValidProduct = await Auction.findOne({
    "winingBidder.user": userId,
  });

  if (!isValidProduct) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You should win the bid for buy this product"
    );
  }
  const create_payment_json = {
    intent: "sale",
    payer: { payment_method: "paypal" },
    redirect_urls: {
      return_url: process.env.PAYPAL_SUCCESS_URL,
      cancel_url: process.env.PAYPAL_CANCEL_URL,
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: orderDetails?.item,
              price: amount,
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: { currency: "USD", total: amount },
        description: "Payment for your order.",
      },
    ],
  };

  // Create PayPal payment and get paymentId
  const payment = await new Promise((resolve, reject) => {
    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        reject(error);
      } else {
        const approvalUrl = payment.links.find(
          (link) => link.rel === "approval_url"
        ).href;
        resolve({ approvalUrl, paymentId: payment.id });
      }
    });
  });

  let order = null;

  // Create the order with the paymentId
  if (orderDetails?.shippingAddress) {
    const orderData = {
      user: userId,
      shippingAddress: orderDetails?.shippingAddress,
      winingBid: orderDetails?.winingBid,
      totalAmount: orderDetails?.totalAmount,
      paidBy: ENUM_PAID_BY.PAYPAL,
      item: orderDetails?.product,
      status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
      statusWithTime: [
        {
          status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
          time: new Date(),
        },
      ],
      paymentId: payment.paymentId,
    };
    order = await Order.create(orderData);
  }

  // Create the transaction with the paymentId
  const transactionData = {
    user: userId,
    item: orderDetails?.item,
    paymentStatus: ENUM_PAYMENT_STATUS.UNPAID,
    paidAmount: orderDetails?.totalAmount,
    itemType: orderDetails?.itemType,
    paymentType: "Online Payment",
    paymentId: payment.paymentId,
  };

  const transaction = await Transaction.create(transactionData);

  return {
    paymentId: payment.paymentId,
    approvalUrl: payment.approvalUrl,
    order,
    transaction,
  };
};

// Execute PayPal payment
// const executePaymentWithPaypal = async (
//   userId,
//   paymentId,
//   payerId,
//   orderDetails
// ) => {
//   const execute_payment_json = { payer_id: payerId };

//   // Start a new session for transaction
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Convert PayPal `execute` to a promise-based function
//     const executePaypalPayment = (paymentId, execute_payment_json) =>
//       new Promise((resolve, reject) => {
//         paypal.payment.execute(
//           paymentId,
//           execute_payment_json,
//           (error, payment) => {
//             if (error) {
//               reject(error);
//             } else {
//               resolve(payment);
//             }
//           }
//         );
//       });

//     // Await the PayPal payment execution
//     const payment = await executePaypalPayment(paymentId, execute_payment_json);

//     // Check if the payment already exists
//     const isExistPayment = await Transaction.findOne({
//       transactionId: payment.cart,
//     });
//     if (isExistPayment) {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         "This payment has already been executed"
//       );
//     }

//     let order = null;

//     // Create the order if shipping address exists
//     if (orderDetails?.shippingAddress) {
//       const orderData = {
//         user: userId,
//         shippingAddress: orderDetails?.shippingAddress,
//         winingBid: orderDetails?.winingBid,
//         paidBy: ENUM_PAID_BY.PAYPAL,
//         item: orderDetails?.item,
//         status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
//         statusWithTime: [
//           {
//             status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
//             time: new Date(),
//           },
//         ],
//       };
//       order = await Order.create([orderData], { session });
//       if (!order) {
//         throw new ApiError(
//           httpStatus.SERVICE_UNAVAILABLE,
//           "Something went wrong. Order not created successfully"
//         );
//       }
//     }

//     // Create the transaction
//     const transactionData = {
//       user: userId,
//       item: orderDetails?.item,
//       paymentStatus: ENUM_PAYMENT_STATUS.PAID,
//       paidAmount: orderDetails?.totalAmount,
//       transactionId: payment?.cart,
//       itemType: orderDetails?.itemType,
//       paymentType: "Online Payment",
//     };

//     const transaction = await Transaction.create([transactionData], {
//       session,
//     });
//     if (!transaction) {
//       throw new ApiError(
//         httpStatus.SERVICE_UNAVAILABLE,
//         "Something went wrong. Transaction not created successfully"
//       );
//     }

//     // Fetch user data
//     const userData = await User.findById(userId).session(session);
//     if (!userData) {
//       throw new ApiError(
//         httpStatus.SERVICE_UNAVAILABLE,
//         "Something went wrong. Try again later"
//       );
//     }

//     // Update the user's bid count if applicable
//     if (orderDetails?.totalBid) {
//       await User.findByIdAndUpdate(
//         userId,
//         {
//           availableBid: userData?.availableBid + orderDetails?.totalBid,
//         },
//         { session }
//       );
//     }

//     const notificationData = [
//       {
//         title: "",
//         message: `Payment of $${orderDetails?.totalAmount} has been received for "${orderDetails?.item}" from ${userData?.name}`,
//         receiver: ENUM_USER_ROLE.ADMIN,
//       },
//       {
//         title: "Payment successfully completed",
//         message: `Your payment for order ${order?._id} is successful. Your product is ready for delivery, track your product for further details`,
//         receiver: userId,
//       },
//     ];

//     await Notification.insertMany(notificationData, { session });
//     // get admin notifications
//     const adminUnseenNotificationCount = await getAdminNotificationCount();
//     global.io.emit("admin-notifications", adminUnseenNotificationCount);
//     // get user notifications
//     const userNotificationCount = await getUnseenNotificationCount(userId);
//     global.io.to(userId).emit("notifications", userNotificationCount);

//     await session.commitTransaction();
//     session.endSession();

//     return {
//       message: "Payment execution successful",
//       order,
//       transaction,
//     };
//   } catch (err) {
//     // Abort the transaction in case of an error
//     await session.abortTransaction();
//     session.endSession();

//     if (err instanceof ApiError) {
//       throw err;
//     }

//     throw new ApiError(
//       httpStatus.SERVICE_UNAVAILABLE,
//       "Something went wrong. Try again later."
//     );
//   }
// };
const executePaymentWithPaypal = async (userId, paymentId, payerId) => {
  const execute_payment_json = { payer_id: payerId };

  // Check if the user is authorized
  const userData = await User.findById(userId);
  if (!userData) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized. You need to log in to make a payment."
    );
  }

  // Start a new session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Convert PayPal `execute` to a promise-based function
    const executePaypalPayment = (paymentId, execute_payment_json) =>
      new Promise((resolve, reject) => {
        paypal.payment.execute(
          paymentId,
          execute_payment_json,
          (error, payment) => {
            if (error) {
              reject(error);
            } else {
              resolve(payment);
            }
          }
        );
      });

    // Await the PayPal payment execution
    const payment = await executePaypalPayment(paymentId, execute_payment_json);
    console.log("Payment executed:", payment);

    // Check if the transaction already exists
    const alreadyPay = await Transaction.findOne({
      transactionId: payment.cart,
    });
    if (alreadyPay) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Payment has already been processed."
      );
    }

    // Update the transaction status to PAID
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { paymentId: paymentId },
      {
        paymentStatus: ENUM_PAYMENT_STATUS.PAID,
        transactionId: payment.cart,
      },
      { new: true, session }
    );

    if (!updatedTransaction) {
      throw new ApiError(httpStatus.NOT_FOUND, "Transaction not found.");
    }

    // Update the order status and statusWithTime
    const updatedOrder = await Order.findOneAndUpdate(
      { paymentId: paymentId, status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING },
      {
        status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
        statusWithTime: [
          {
            status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
            time: new Date(),
          },
        ],
      },
      { new: true, session }
    );

    if (!updatedOrder) {
      throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
    }

    // Prepare notification data
    const notificationData = [
      {
        title: "",
        message: `Payment of $${updatedOrder.totalAmount} has been received for "${updatedOrder.item}" from ${userData.name}.`,
        receiver: ENUM_USER_ROLE.ADMIN,
      },
      {
        title: "Payment successfully completed",
        message: `Your payment for order ${updatedOrder._id} is successful. Your product is ready for delivery; track your product for further details.`,
        receiver: userId,
      },
    ];

    // Insert notifications
    await Notification.insertMany(notificationData, { session });

    // Emit notifications to the admin and user
    const adminUnseenNotificationCount = await getAdminNotificationCount();
    global.io.emit("admin-notifications", adminUnseenNotificationCount);

    const userNotificationCount = await getUnseenNotificationCount(userId);
    global.io.to(userId).emit("notifications", userNotificationCount);

    // Commit the transaction
    await session.commitTransaction();
    return {
      message: "Payment execution successful",
      order: updatedOrder,
      transaction: updatedTransaction,
    };
  } catch (err) {
    await session.abortTransaction();

    session.endSession();

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      err.message || "Something went wrong. Try again later."
    );
  } finally {
    // Ensure the session ends
    session.endSession();
  }
};

const executePaymentWithCreditCard = async (paymentId) => {
  // Update the transaction status to PAID
  const updatedTransaction = await Transaction.findOneAndUpdate(
    { paymentId: paymentId },
    {
      paymentStatus: ENUM_PAYMENT_STATUS.PAID,
      transactionId: paymentId,
    },
    { new: true }
  );

  if (!updatedTransaction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Transaction not found.");
  }

  // Update the order status and statusWithTime
  const updatedOrder = await Order.findOneAndUpdate(
    { paymentId: paymentId, status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING },
    {
      status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
      statusWithTime: [
        {
          status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
          time: new Date(),
        },
      ],
    },
    { new: true }
  );

  if (!updatedOrder) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
  }

  return {
    message: "Payment execute successfully",
    order: updatedOrder,
    transaction: updatedTransaction,
  };
};

const PaymentService = {
  makePaymentWithCreditCard,
  createPaymentWithPaypal,
  executePaymentWithPaypal,
  createPaymentIntent,
  executePaymentWithCreditCard,
};

module.exports = PaymentService;
