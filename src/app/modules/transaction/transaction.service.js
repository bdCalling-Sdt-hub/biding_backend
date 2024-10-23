const QueryBuilder = require("../../../builder/queryBuilder");
const { ENUM_PAYMENT_STATUS } = require("../../../utils/enums");
const { Transaction } = require("../payment/payment.model");
const cron = require("node-cron");
const getAllTransactionFromDB = async (query) => {
  const transactionQuery = new QueryBuilder(
    Transaction.find().populate({ path: "user" }),
    query
  )
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

// This cron job runs every 5 mins for delete unpaid transaction--------------------
cron.schedule("*/1 * * * *", async () => {
  try {
    // Get the time that is 10 minutes ago from now
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Query to delete orders that match the criteria
    const result = await Transaction.deleteMany({
      paymentStatus: ENUM_PAYMENT_STATUS.UNPAID,
      createdAt: { $lte: fiveMinsAgo },
    });

    console.log(`${result.deletedCount} transaction deleted.`);
  } catch (error) {
    console.error("Error running the cron job:", error);
  }
});

const transactionService = {
  getAllTransactionFromDB,
  getSingleTransactionFromDB,
};

module.exports = transactionService;
