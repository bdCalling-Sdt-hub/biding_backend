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

const getAllAuction = catchAsync(async (req, res) => {
  const result = await auctionService.getAllAuctionFromDB();

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Auction retrieved successfully",
    data: result,
  });
});
const updateAuction = catchAsync(async (req, res) => {
  const id = req.params?.id;
  const data = req?.body;
  const newImages = req?.files?.image;

  const result = await auctionService.updateAuctionIntoDB(id, newImages, data);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Auction retrieved successfully",
    data: result,
  });
});

const auctionController = {
  createAuction,
  getAllAuction,
  updateAuction,
};

module.exports = auctionController;
