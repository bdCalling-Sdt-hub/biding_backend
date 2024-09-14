const httpStatus = require("http-status");
const config = require("../../../config");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const { Payment, Transaction } = require("./payment.model");
const stripe = require("stripe")(config.stripe.stripe_secret_key);

const createPaymentIntent = async (payload) => {
  const { amount, email } = payload;
  console.log(payload);
  if (!amount) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No amount found");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: parseInt(Math.trunc(amount) * 100),
    currency: "usd",
    payment_method_types: ["card"],
  });

  const { id, client_secret, amount: deductedAmount } = paymentIntent;

  const saveTransaction = { ...payload, transactionId: id };

  const transaction = await Transaction.create(saveTransaction);

  return {
    transactionId: id,
    client_secret,
    deductedAmount: deductedAmount / 100,
  };
};

const savePaymentUpdateSpending = async (payload) => {
  const { amount, email, transactionId } = payload;

  if (!amount || !email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email or amount not sent");
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "No user found");
  }

  const existingTransaction = await Transaction.find({
    email: email,
    transactionId: transactionId,
  });

  if (!existingTransaction.length) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Please complete transaction first or your email or transactionId doesn't match."
    );
  }

  const result = await User.findOneAndUpdate(
    { email: email },
    { $inc: { amount: parseInt(amount) } },
    { new: true, runValidators: true }
  ).select("email amount");

  const payment = await Payment.create(payload);

  return { result, payment };
};

const updateTotalEarning = async (payload) => {
  const { amount, email } = payload;

  if (!amount || !email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email or amount not sent");
  }

  const driver = await Driver.findOne({ email: email });

  if (!driver) {
    throw new ApiError(httpStatus.NOT_FOUND, "No driver found");
  }

  return await Driver.findOneAndUpdate(
    { email: email },
    { $inc: { amount: parseInt(amount) } },
    { new: true, runValidators: true }
  ).select("email amount");
};

const allPayments = async (req, res) => {
  const payments = await Payment.find();
  const count = await Payment.countDocuments();

  return { count, payments };
};

const PaymentService = {
  createPaymentIntent,
  savePaymentUpdateSpending,
  updateTotalEarning,
  allPayments,
};

module.exports = PaymentService;
