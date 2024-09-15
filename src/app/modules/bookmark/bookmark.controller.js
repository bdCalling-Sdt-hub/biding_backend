const catchAsync = require("../../../shared/catchasync");
const bookmarkService = require("./bookmark.service");

const createBookmark = catchAsync(async (req, res) => {
  const result = await bookmarkService.createBookmarkIntoDB(
    req?.params?.auctionId,
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
