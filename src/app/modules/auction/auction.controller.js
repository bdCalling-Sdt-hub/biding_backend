const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");

const createAuction = catchAsync(async (req, res) => {
  const result = await auctionService.createAuctionIntoDB();

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Auction created successfully",
    data: result,
  });
});

const auctionController = {
  createAuction,
};

module.exports = auctionController;
