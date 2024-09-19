const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const transactionService = require("./transaction.service");

const getAllTransaction = catchAsync(async (req, res) => {
  const result = await transactionService.getAllTransactionFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Transaction retrieved successfully",
    data: result,
  });
});

const transactionController = {
  getAllTransaction,
};

module.exports = transactionController;
