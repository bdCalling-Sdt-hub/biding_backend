const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const bookmarkService = require("./bookmark.service");

const createBookmark = catchAsync(async (req, res) => {
  const result = await bookmarkService.createBookmarkIntoDB(
    req?.body?.auctionId,
    req?.user
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Bookmark created successfully",
    data: result,
  });
});

const bookmarkController = {
  createBookmark,
};

module.exports = bookmarkController;
