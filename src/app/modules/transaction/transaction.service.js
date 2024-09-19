const QueryBuilder = require("../../../builder/QueryBuilder");
const { Transaction } = require("../payment/payment.model");

const getAllTransactionFromDB = async (query) => {
  const transactionQuery = new QueryBuilder(Transaction.find(), query)
    .search(["item"])
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await transactionQuery.modelQuery;
  const meta = await transactionQuery.countTotal();
  return { meta, result };
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
