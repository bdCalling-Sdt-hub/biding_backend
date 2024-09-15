const Bookmark = require("./bookmark.model");

const createBookmarkIntoDB = async (auctionId, user) => {
  const bookmarkData = {
    user: user?.userId,
    auction: auctionId,
  };
  const result = await Bookmark.create(bookmarkData);
  return result;
};

const bookmarkService = {
  createBookmarkIntoDB,
};

module.exports = bookmarkService;
