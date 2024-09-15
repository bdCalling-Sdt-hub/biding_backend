const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Bookmark = require("./bookmark.model");

const createBookmarkIntoDB = async (auctionId, user) => {
  const bookmark = await Bookmark.findOne({ auction: auctionId });
  if (bookmark) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You already added this auction to bookmark"
    );
  }
  const bookmarkData = {
    user: user?.userId,
    auction: auctionId,
  };
  const result = await Bookmark.create(bookmarkData);
  return result;
};

// get bookmark from db
const getMyBookmarkFromDB = async (user) => {
  const result = await Bookmark.find({ user: user?.userId }).populate(
    "auction"
  );
  return result;
};

// delete bookmark
const deleteBookmarkFromDB = async (id, user) => {
  const bookmark = await Bookmark.findById(id);

  if (!bookmark) {
    throw new ApiError(httpStatus.NOT_FOUND, "This bookmark does not exists");
  }
  if ((bookmark?.user).toString() !== user?.userId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You don't have access to delete this bookmark"
    );
  }
  const result = await Bookmark.findByIdAndDelete(id);
  return result;
};
const bookmarkService = {
  createBookmarkIntoDB,
  getMyBookmarkFromDB,
  deleteBookmarkFromDB,
};

module.exports = bookmarkService;
