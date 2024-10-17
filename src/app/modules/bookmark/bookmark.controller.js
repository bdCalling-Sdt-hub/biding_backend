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
// get my bookmark
const getMyBookmark = catchAsync(async (req, res) => {
  const result = await bookmarkService.getMyBookmarkFromDB(req?.user);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Bookmark retrieved successfully",
    data: result,
  });
});
// delete bookmark
const deleteBookmark = catchAsync(async (req, res) => {
  const result = await bookmarkService.deleteBookmarkFromDB(
    req?.params?.auctionId,
    req?.user
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Bookmark deleted successfully",
    data: result,
  });
});

const bookmarkController = {
  createBookmark,
  getMyBookmark,
  deleteBookmark,
};

module.exports = bookmarkController;
