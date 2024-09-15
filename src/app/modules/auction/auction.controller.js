const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const auctionService = require("./auction.service");

const createAuction = catchAsync(async (req, res) => {
  const result = await auctionService.createAuctionIntoDB(
    req?.files?.image,
    req?.body
  );

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
