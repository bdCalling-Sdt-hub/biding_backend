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

// Create PayPal payment
const createPaymentWithPaypal = async (amount, productName) => {
  console.log(amount, productName);
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
              name: productName,
              // name: "Item",
              // sku: "item",
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

  return new Promise((resolve, reject) => {
    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        reject(error);
      } else {
        const approvalUrl = payment.links.find(
          (link) => link.rel === "approval_url"
        ).href;
        resolve(approvalUrl);
      }
    });
  });
};

// Execute PayPal payment
const executePaymentWithPaypal = async (
  userId,
  paymentId,
  payerId,
  orderDetails
) => {
  const execute_payment_json = { payer_id: payerId };

  // Start a new session for transaction
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

    // Check if the payment already exists
    const isExistPayment = await Transaction.findOne({
      transactionId: payment.cart,
    });
    if (isExistPayment) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This payment has already been executed"
      );
    }

    let order = null;

    // Create the order if shipping address exists
    if (orderDetails?.shippingAddress) {
      const orderData = {
        user: userId,
        shippingAddress: orderDetails?.shippingAddress,
        winingBid: orderDetails?.winingBid,
        paidBy: ENUM_PAID_BY.PAYPAL,
        item: orderDetails?.item,
        status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
        statusWithTime: [
          {
            status: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
            time: new Date(),
          },
        ],
      };
      order = await Order.create([orderData], { session });
      if (!order) {
        throw new ApiError(
          httpStatus.SERVICE_UNAVAILABLE,
          "Something went wrong. Order not created successfully"
        );
      }
    }

    // Create the transaction
    const transactionData = {
      user: userId,
      item: orderDetails?.item,
      paymentStatus: ENUM_PAYMENT_STATUS.PAID,
      paidAmount: orderDetails?.totalAmount,
      transactionId: payment?.cart,
      itemType: orderDetails?.itemType,
      paymentType: "Online Payment",
    };

    const transaction = await Transaction.create([transactionData], {
      session,
    });
    if (!transaction) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        "Something went wrong. Transaction not created successfully"
      );
    }

    // Fetch user data
    const userData = await User.findById(userId).session(session);
    if (!userData) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        "Something went wrong. Try again later"
      );
    }

    // Update the user's bid count if applicable
    if (orderDetails?.totalBid) {
      await User.findByIdAndUpdate(
        userId,
        {
          availableBid: userData?.availableBid + orderDetails?.totalBid,
        },
        { session }
      );
    }

    const notificationData = [
      {
        title: "",
        message: `Payment of $${orderDetails?.totalAmount} has been received for "${orderDetails?.item}" from ${userData?.name}`,
        receiver: ENUM_USER_ROLE.ADMIN,
      },
      {
        title: "Payment successfully completed",
        message: `Your payment for order ${order?._id} is successful. Your product is ready for delivery, track your product for further details`,
        receiver: userId,
      },
    ];

    await Notification.insertMany(notificationData, { session });
    // get admin notifications
    const adminUnseenNotificationCount = await getAdminNotificationCount();
    global.io.emit("admin-notifications", adminUnseenNotificationCount);
    // get user notifications
    const userNotificationCount = await getUnseenNotificationCount(userId);
    global.io.to(userId).emit("notifications", userNotificationCount);

    await session.commitTransaction();
    session.endSession();

    return {
      message: "Payment execution successful",
      order,
      transaction,
    };
  } catch (err) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    session.endSession();

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Something went wrong. Try again later."
    );
  }
};

// const createPaymentIntent = async (payload) => {
//   const { amount, email } = payload;
//   console.log(payload);
//   if (!amount) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "No amount found");
//   }

//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: parseInt(Math.trunc(amount) * 100),
//     currency: "usd",
//     payment_method_types: ["card"],
//   });

//   const { id, client_secret, amount: deductedAmount } = paymentIntent;

//   const saveTransaction = { ...payload, transactionId: id };

//   const transaction = await Transaction.create(saveTransaction);

//   return {
//     transactionId: id,
//     client_secret,
//     deductedAmount: deductedAmount / 100,
//   };
// };

// const savePaymentUpdateSpending = async (payload) => {
//   const { amount, email, transactionId } = payload;

//   if (!amount || !email) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Email or amount not sent");
//   }

//   const user = await User.findOne({ email: email });

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "No user found");
//   }

//   const existingTransaction = await Transaction.find({
//     email: email,
//     transactionId: transactionId,
//   });

//   if (!existingTransaction.length) {
//     throw new ApiError(
//       httpStatus.NOT_FOUND,
//       "Please complete transaction first or your email or transactionId doesn't match."
//     );
//   }

//   const result = await User.findOneAndUpdate(
//     { email: email },
//     { $inc: { amount: parseInt(amount) } },
//     { new: true, runValidators: true }
//   ).select("email amount");

//   const payment = await Payment.create(payload);

//   return { result, payment };
// };

// const updateTotalEarning = async (payload) => {
//   const { amount, email } = payload;

//   if (!amount || !email) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Email or amount not sent");
//   }

//   const driver = await Driver.findOne({ email: email });

//   if (!driver) {
//     throw new ApiError(httpStatus.NOT_FOUND, "No driver found");
//   }

//   return await Driver.findOneAndUpdate(
//     { email: email },
//     { $inc: { amount: parseInt(amount) } },
//     { new: true, runValidators: true }
//   ).select("email amount");
// };

// const allPayments = async (req, res) => {
//   const payments = await Payment.find();
//   const count = await Payment.countDocuments();

//   return { count, payments };
// };

const PaymentService = {
  // createPaymentIntent,
  // savePaymentUpdateSpending,
  // updateTotalEarning,
  // allPayments,
  makePaymentWithCreditCard,
  createPaymentWithPaypal,
  executePaymentWithPaypal,
};

module.exports = PaymentService;
