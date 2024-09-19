const { Transaction } = require("../payment/payment.model");

const getAllTransactionFromDB = async () => {
  const result = await Transaction.find();

  return result;
};
// get single transaction
const getSingleTransactionFromDB = async (id) => {
  const result = await Transaction.findById(id);
  return result;
};

const transactionService = {
  getAllTransactionFromDB,
  getSingleTransactionFromDB,
};

module.exports = transactionService;
