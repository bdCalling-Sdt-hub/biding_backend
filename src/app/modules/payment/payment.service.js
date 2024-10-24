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
  ENUM_ORDER_TYPE,
  ENUM_ITEM_TYPE,
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

const createPaymentIntent = async (orderDetails, userId) => {
  console.log("create payment intent", orderDetails);
  if (orderDetails.itemType === ENUM_ITEM_TYPE.BID) {
    if (orderDetails.totalBid < 10) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You can not buy less then 10 credits"
      );
    }
    if (orderDetails.totalBid / Number(orderDetails.totalAmount) !== 10) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Unauthorized access");
    }
  }

  if (
    orderDetails.itemType === ENUM_ITEM_TYPE.PRODUCT &&
    !orderDetails.shippingAddress
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You need to add shipping address before order"
    );
  }
  if (orderDetails?.shippingAddress) {
    const isValidProduct = await Auction.findOne({
      "winingBidder.user": userId,
    });
    if (!isValidProduct) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You should win the bid for buy this product"
      );
    }

    const isExistOrder = await Order.findOne({
      item: orderDetails?.product,
    });
    if (isExistOrder) {
      if (isExistOrder.paidBy === ENUM_PAID_BY.OTHER) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "You already order this product with finance , wait for response"
        );
      }
      if (isExistOrder.status !== ENUM_DELIVERY_STATUS.PAYMENT_PENDING) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "You already order this product"
        );
      }
    }
  }

  const { totalAmount, shippingAddress, item, itemType, winingBid, product } =
    orderDetails;
  const auction = await Auction.findById(orderDetails?.product).select(
    "totalMonthForFinance currentPrice"
  );
  const totalMonth = auction?.totalMonthForFinance || 0;
  const monthlyAmount = (auction?.currentPrice / totalMonth)?.toFixed(2) || 0;
  let paymentAmount;
  if (orderDetails?.shippingAddress) {
    paymentAmount =
      orderDetails?.orderType === ENUM_ORDER_TYPE.FINANCE
        ? monthlyAmount
        : auction?.currentPrice.toFixed();
  } else {
    paymentAmount = totalAmount;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number((paymentAmount * 100).toFixed(2)),
    currency: "usd",
    payment_method_types: ["card"],
  });

  let order;
  if (orderDetails?.shippingAddress) {
    console.log("Nice");
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    const isExistIntent = await Order.findOne({
      item: orderDetails?.product,
    });
    if (isExistIntent) {
      await Order.findOneAndUpdate(
        { item: orderDetails?.product },
        { paymentId: paymentIntent.id }
      );
      const existingTransaction = await Transaction.findOne({
        item: orderDetails.item,
      });

      await Transaction.findOneAndUpdate(
        { item: orderDetails?.item },
        {
          paymentId: paymentIntent.id,
          transactionId: paymentIntent.id,
        }
      );
    } else {
      const orderData = {
        user: userId,
        shippingAddress: shippingAddress,
        winingBid: winingBid,
        totalAmount: auction?.currentPrice,
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
        // new features
        expectedDeliveryData: fiveDaysFromNow,
        monthlyAmount: monthlyAmount,
        totalMonth: totalMonth,
        orderType: orderDetails?.orderType,
        dueAmount:
          orderDetails?.orderType === ENUM_ORDER_TYPE.FINANCE
            ? auction?.currentPrice
            : 0,
      };
      order = await Order.create(orderData);
      // 5. Create a new transaction
      const transactionData = {
        user: userId,
        item: item,
        paymentStatus: ENUM_PAYMENT_STATUS.UNPAID,
        paidAmount: totalAmount,
        itemType: itemType,
        // paymentType: "Online Payment",
        // paymentType: "Online Payment",
        paymentType: orderDetails?.paymentType,
        paymentId: paymentIntent.id,
        transactionId: paymentIntent.id,
        totalBid: orderDetails?.totalBid || 0,
      };

      await Transaction.create(transactionData);
    }
  }
  // changes
  if (orderDetails?.orderId) {
    await Order.findByIdAndUpdate(orderDetails?.orderId, {
      paymentId: paymentIntent.id,
    });
    const transactionData = {
      user: userId,
      item: item,
      paymentStatus: ENUM_PAYMENT_STATUS.UNPAID,
      paidAmount: totalAmount,
      itemType: itemType,
      // paymentType: "Online Payment",
      // paymentType: "Online Payment",
      paymentType: orderDetails?.paymentType,
      paymentId: paymentIntent.id,
      transactionId: paymentIntent.id,
      totalBid: orderDetails?.totalBid || 0,
    };

    await Transaction.create(transactionData);
  }

  if (itemType === ENUM_ITEM_TYPE.BID) {
    const transactionData = {
      user: userId,
      item: item,
      paymentStatus: ENUM_PAYMENT_STATUS.UNPAID,
      paidAmount: totalAmount,
      itemType: itemType,
      // paymentType: "Online Payment",
      // paymentType: "Online Payment",
      paymentType: orderDetails?.paymentType,
      paymentId: paymentIntent.id,
      transactionId: paymentIntent.id,
      totalBid: orderDetails?.totalBid || 0,
    };

    await Transaction.create(transactionData);
  }

  return {
    clientSecret: paymentIntent.client_secret,
  };
};

const createPaymentWithPaypal = async (userId, amount, orderDetails) => {
  if (orderDetails.itemType === ENUM_ITEM_TYPE.BID) {
    if (orderDetails.totalBid < 10) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You can not buy less then 10 credits"
      );
    }
    if (orderDetails.totalBid / Number(amount) !== 10) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Unauthorized access");
    }
  }

  if (
    orderDetails.itemType === ENUM_ITEM_TYPE.PRODUCT &&
    !orderDetails.shippingAddress
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You need to add shipping address before order"
    );
  }

  if (orderDetails?.shippingAddress) {
    const isValidProduct = await Auction.findOne({
      "winingBidder.user": userId,
      currentPrice: orderDetails.totalAmount,
    });

    if (!isValidProduct) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You should win the bid for buy this product"
      );
    }
    const isExistIntent = await Order.findOne({
      item: orderDetails?.product,
    });
    if (isExistIntent) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You already create intent for this product"
      );
    }
  }

  const auction = await Auction.findById(orderDetails?.product).select(
    "totalMonthForFinance currentPrice"
  );
  const totalMonth = auction?.totalMonthForFinance || 0;
  const monthlyAmount = (auction?.currentPrice / totalMonth)?.toFixed(2) || 0;
  let paymentAmount;
  if (orderDetails?.shippingAddress) {
    paymentAmount =
      orderDetails?.orderType === ENUM_ORDER_TYPE.FINANCE
        ? monthlyAmount
        : auction?.currentPrice.toFixed(2);
  } else {
    paymentAmount = amount;
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
              price: Number(paymentAmount).toFixed(2),
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: { currency: "USD", total: Number(paymentAmount).toFixed(2) },
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
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    const orderData = {
      user: userId,
      shippingAddress: orderDetails?.shippingAddress,
      winingBid: orderDetails?.winingBid,
      totalAmount: orderDetails?.totalAmount,
      paidBy: ENUM_PAID_BY.PAYPAL,
      productName: orderDetails?.item,
      item: orderDetails?.product,
      status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
      statusWithTime: [
        {
          status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING,
          time: new Date(),
        },
      ],
      paymentId: payment.paymentId,
      // new features
      expectedDeliveryData: fiveDaysFromNow,
      monthlyAmount: monthlyAmount,
      totalMonth: totalMonth,
      orderType: orderDetails?.orderType,
      dueAmount: orderDetails?.dueAmount || 0,
    };
    order = await Order.create(orderData);
  }

  // new features code
  if (orderDetails?.orderId) {
    await Order.findByIdAndUpdate(orderDetails?.orderId, {
      paymentId: payment.paymentId,
    });
  }

  // Create the transaction with the paymentId
  const transactionData = {
    user: userId,
    item: orderDetails?.item,
    paymentStatus: ENUM_PAYMENT_STATUS.UNPAID,
    paidAmount: orderDetails?.totalAmount,
    itemType: orderDetails?.itemType,
    // paymentType: "Online Payment",
    paymentType: orderDetails?.paymentType,
    paymentId: payment.paymentId,
    totalBid: orderDetails?.totalBid || 0,
  };

  const transaction = await Transaction.create(transactionData);

  return {
    paymentId: payment.paymentId,
    approvalUrl: payment.approvalUrl,
  };
};

// const executePaymentWithPaypal = async (userId, paymentId, payerId) => {
//   const execute_payment_json = { payer_id: payerId };

//   // Check if the user is authorized
//   const userData = await User.findById(userId);
//   if (!userData) {
//     throw new ApiError(
//       httpStatus.UNAUTHORIZED,
//       "You are not authorized. You need to log in to make a payment."
//     );
//   }

//   // Start a new session for the transaction
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
//     console.log("nice to meet you before updated order 1");
//     // Await the PayPal payment execution
//     const payment = await executePaypalPayment(paymentId, execute_payment_json);
//     console.log("nice to meet you before updated order 2");
//     // Check if the transaction already exists
//     const alreadyPay = await Transaction.findOne({
//       transactionId: payment.cart,
//     });
//     if (alreadyPay) {
//       throw new ApiError(
//         httpStatus.CONFLICT,
//         "Payment has already been processed."
//       );
//     }
//     console.log("nice to meet you before updated order 3");
//     // Update the transaction status to PAID
//     const updatedTransaction = await Transaction.findOneAndUpdate(
//       { paymentId: paymentId },
//       {
//         paymentStatus: ENUM_PAYMENT_STATUS.PAID,
//         transactionId: payment.cart,
//       },
//       { new: true, session }
//     );
//     console.log("nice to meet you before updated order 4");
//     console.log(
//       "updated transaction----------------------------------- ",
//       updatedTransaction
//     );

//     if (updatedTransaction?.totalBid > 0) {
//       await User.findByIdAndUpdate(
//         userId,
//         {
//           $inc: { availableBid: updatedTransaction.totalBid },
//         },
//         { new: true }
//       );
//     }

//     if (!updatedTransaction) {
//       throw new ApiError(httpStatus.NOT_FOUND, "Transaction not found.");
//     }

//     // Update the order status and statusWithTime
//     const isFinanceOrder = await Order.findOne({
//       paymentId: paymentId,
//       orderType: ENUM_ORDER_TYPE.FINANCE,
//     });
//     console.log("nice to meet you before updated order");
//     let updatedOrder;
//     if (isFinanceOrder) {
//       updatedOrder = await Order.findOneAndUpdate(
//         {
//           paymentId: paymentId,
//           orderType: ENUM_ORDER_TYPE.FINANCE,
//         },
//         {
//           $inc: {
//             paidInstallment: 1,
//             dueAmount: -updatedTransaction?.paidAmount,
//           },
//           $set: {
//             lastPayment: Date.now(),
//             // Update status and statusWithTime only if current status is pending
//             ...((
//               await Order.findOne({
//                 paymentId: paymentId,
//                 orderType: ENUM_ORDER_TYPE.FINANCE,
//               })
//             ).status === ENUM_DELIVERY_STATUS.PENDING
//               ? {
//                   status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
//                   statusWithTime: [
//                     {
//                       status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
//                       time: new Date(),
//                     },
//                   ],
//                 }
//               : {}),
//           },
//         },
//         {
//           new: true,
//         }
//       );
//     } else {
//       updatedOrder = await Order.findOneAndUpdate(
//         { paymentId: paymentId, status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING },
//         {
//           status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
//           statusWithTime: [
//             {
//               status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
//               time: new Date(),
//             },
//           ],
//         },
//         { new: true, session }
//       );
//     }

//     console.log("nice to meet you");

//     console.log("updated order", updatedOrder);

//     // if (!updatedOrder) {
//     //   throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
//     // }

//     // Prepare notification data
//     // const notificationData = [
//     //   {
//     //     title: "",
//     //     message: `Payment of $${updatedTransaction?.paidAmount} has been received for "${updatedTransaction.item}" from ${userData.name}.`,
//     //     receiver: ENUM_USER_ROLE.ADMIN,
//     //   },
//     //   {
//     //     title: "Payment successfully completed",
//     //     message: `${
//     //       isFinanceOrder
//     //         ? `Your payment for order ${updatedOrder._id} is successful. Your product is ready for delivery; track your product for further details.`
//     //         : `Your payment for order ${updatedOrder._id} is successful`
//     //     }`,
//     //     receiver: userId,
//     //   },
//     // ];

//     // // Insert notifications
//     // await Notification.insertMany(notificationData, { session });
//     const adminNotificationData = {
//       title: "",
//       message: `Payment of $${updatedTransaction?.paidAmount} has been received for "${updatedTransaction.item}" from ${userData.name}.`,
//       receiver: ENUM_USER_ROLE.ADMIN,
//     };
//     await Notification.create(adminNotificationData);

//     if (updatedOrder) {
//       const userNotificationData = {
//         title: "Payment successfully completed",
//         message: `${
//           isFinanceOrder
//             ? `Your payment for order ${updatedOrder._id} is successful. Your product is ready for delivery; track your product for further details.`
//             : `Your payment for order ${updatedOrder._id} is successful`
//         }`,
//         receiver: userId,
//       };
//       await Notification.create(userNotificationData);
//     }

//     // Emit notifications to the admin and user
//     const adminUnseenNotificationCount = await getAdminNotificationCount();
//     global.io.emit("admin-notifications", adminUnseenNotificationCount);

//     const userNotificationCount = await getUnseenNotificationCount(userId);
//     global.io.to(userId).emit("notifications", userNotificationCount);

//     await session.commitTransaction();
//     return {
//       message: "Payment execution successful",
//       order: updatedOrder,
//       transaction: updatedTransaction,
//     };
//   } catch (err) {
//     await session.abortTransaction();

//     session.endSession();

//     if (err instanceof ApiError) {
//       throw err;
//     }

//     throw new ApiError(
//       httpStatus.SERVICE_UNAVAILABLE,
//       err.message || "Something went wrong. Try again later."
//     );
//   } finally {
//     session.endSession();
//   }
// };
const executePaymentWithPaypal = async (userId, paymentId, payerId) => {
  console.log("payer id", payerId);
  const execute_payment_json = { payer_id: payerId };

  // Check if the user is authorized
  const userData = await User.findById(userId);
  if (!userData) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized. You need to log in to make a payment."
    );
  }

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

  // Execute PayPal payment
  const payment = await executePaypalPayment(paymentId, execute_payment_json);

  // Check if the transaction already exists
  const alreadyPay = await Transaction.findOne({ transactionId: payment.cart });
  if (alreadyPay) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Payment has already been processed."
    );
  }

  // Update the order status
  const isFinanceOrder = await Order.findOne({
    paymentId,
    orderType: ENUM_ORDER_TYPE.FINANCE,
  });
  let updatedOrder;

  if (isFinanceOrder) {
    updatedOrder = await Order.findOneAndUpdate(
      { paymentId, orderType: ENUM_ORDER_TYPE.FINANCE },
      {
        $inc: {
          paidInstallment: 1,
          dueAmount: -payment.transactions[0].amount.total,
        },
        $set: {
          lastPayment: Date.now(),
          status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
        },
      },
      { new: true }
    );
  } else {
    updatedOrder = await Order.findOneAndUpdate(
      { paymentId, status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING },
      {
        status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
        statusWithTime: [
          { status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS, time: new Date() },
        ],
      },
      { new: true }
    );
  }

  // Send notifications
  const adminNotificationData = {
    title: "",
    message: `Payment of $${payment.transactions[0].amount.total} has been received for "${payment.transactions[0].description}" from ${userData.name}.`,
    receiver: ENUM_USER_ROLE.ADMIN,
  };
  await Notification.create(adminNotificationData);

  const userNotificationData = {
    title: "Payment successfully completed",
    message: `Your payment for order ${updatedOrder._id} is successful.`,
    receiver: userId,
  };
  await Notification.create(userNotificationData);

  // Emit notifications to admin and user
  const adminUnseenNotificationCount = await getAdminNotificationCount();
  global.io.emit("admin-notifications", adminUnseenNotificationCount);

  const userNotificationCount = await getUnseenNotificationCount(userId);
  global.io.to(userId).emit("notifications", userNotificationCount);

  return { message: "Payment execution successful", order: updatedOrder };
};

const executePaymentWithCreditCard = async (paymentId, userId) => {
  const userData = await User.findById(userId);
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

  console.log("updated transaction --------------------", updatedTransaction);

  if (updatedTransaction?.totalBid > 0) {
    await User.findByIdAndUpdate(
      userId,
      {
        $inc: { availableBid: updatedTransaction.totalBid },
      },
      { new: true }
    );
  }

  // Update the order status and statusWithTime
  // const updatedOrder = await Order.findOneAndUpdate(
  //   { paymentId: paymentId, status: ENUM_DELIVERY_STATUS.PAYMENT_PENDING },
  //   {
  //     status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
  //     statusWithTime: [
  //       {
  //         status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
  //         time: new Date(),
  //       },
  //     ],
  //   },
  //   { new: true }
  // );
  // Update the order status and statusWithTime
  const isFinanceOrder = await Order.findOne({
    paymentId: paymentId,
    orderType: ENUM_ORDER_TYPE.FINANCE,
  });
  let updatedOrder;
  if (isFinanceOrder) {
    // updatedOrder = await Order.findOneAndUpdate(
    //   {
    //     paymentId: paymentId,
    //     orderType: ENUM_ORDER_TYPE.FINANCE,
    //   },
    //   {
    //     $inc: {
    //       paidInstallment: 1,
    //       dueAmount: -updatedTransaction?.paidAmount,
    //     },
    //     $set: { lastPayment: Date.now() },
    //     statusWithTime: [
    //       {
    //         status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
    //         time: new Date(),
    //       },
    //     ],
    //   }
    // );
    updatedOrder = await Order.findOneAndUpdate(
      {
        paymentId: paymentId,
        orderType: ENUM_ORDER_TYPE.FINANCE,
      },
      {
        $inc: {
          paidInstallment: 1,
          dueAmount: -updatedTransaction?.paidAmount,
        },
        $set: {
          lastPayment: Date.now(),
          // Update status and statusWithTime only if current status is pending
          ...((
            await Order.findOne({
              paymentId: paymentId,
              orderType: ENUM_ORDER_TYPE.FINANCE,
            })
          ).status === ENUM_DELIVERY_STATUS.PENDING
            ? {
                status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
                statusWithTime: [
                  {
                    status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
                    time: new Date(),
                  },
                ],
              }
            : {}),
        },
      },
      {
        new: true,
      }
    );
  } else {
    updatedOrder = await Order.findOneAndUpdate(
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
  }

  // if (!updatedOrder) {
  //   throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
  // }

  // Prepare notification data
  // const notificationData = [
  //   {
  //     title: "",
  //     message: `Payment of $${updatedTransaction?.paidAmount} has been received for "${updatedTransaction.item}" from ${userData.name}.`,
  //     receiver: ENUM_USER_ROLE.ADMIN,
  //   },
  //   {
  //     title: "Payment successfully completed",
  //     message: `${
  //       isFinanceOrder
  //         ? `Your payment for order ${updatedOrder._id} is successful. Your product is ready for delivery; track your product for further details.`
  //         : `Your payment for order ${updatedOrder._id} is successful`
  //     }`,
  //     receiver: userId,
  //   },
  // ];
  // // Insert notifications
  // await Notification.insertMany(notificationData);

  const adminNotificationData = {
    title: "",
    message: `Payment of $${updatedTransaction?.paidAmount} has been received for "${updatedTransaction.item}" from ${userData.name}.`,
    receiver: ENUM_USER_ROLE.ADMIN,
  };
  await Notification.create(adminNotificationData);

  if (updatedOrder) {
    const userNotificationData = {
      title: "Payment successfully completed",
      message: `${
        isFinanceOrder
          ? `Your payment for order ${updatedOrder._id} is successful. Your product is ready for delivery; track your product for further details.`
          : `Your payment for order ${updatedOrder._id} is successful`
      }`,
      receiver: userId,
    };
    await Notification.create(userNotificationData);
  }

  // if (!updatedOrder) {
  //   throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
  // }

  return {
    message: "Order Confirmed",
    order: updatedOrder,
    transaction: updatedTransaction,
  };
};

const PaymentService = {
  createPaymentWithPaypal,
  executePaymentWithPaypal,
  createPaymentIntent,
  executePaymentWithCreditCard,
};

module.exports = PaymentService;
