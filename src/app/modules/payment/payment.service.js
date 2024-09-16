const httpStatus = require("http-status");
const config = require("../../../config");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const { Payment, Transaction } = require("./payment.model");
const stripe = require("stripe")(config.stripe.stripe_secret_key);

const makePaymentWithCreditCard = async (
  user,
  item,
  quantity,
  amount,
  token,
  type
) => {
  let customer;

  const user = await User.findById(user?.userId);
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
};

module.exports = PaymentService;
