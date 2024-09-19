const { Transaction } = require("../payment/payment.model");

const getAllTransactionFromDB = async () => {
  const result = await Transaction.find();

  return result;
};

const transactionService = {
  getAllTransactionFromDB,
};

module.exports = transactionService;
