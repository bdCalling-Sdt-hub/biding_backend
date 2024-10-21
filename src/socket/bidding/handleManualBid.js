const httpStatus = require("http-status");
const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const ApiError = require("../../errors/ApiError");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");
const getUpdatedAuction = require("../../helpers/getUpdatedAuctiion");

const handleManualBid = async (io, socket) => {
  socket.on("place-manual-bid", async (data) => {
    const auctionId = data?.auction_id;
    const userId = data?.user_id;

    const userData = await User.findById(userId);
    if (userData.is_block) {
      io.to(userId).emit("socket-error", {
        errorMessage: "You are not authorized for place bid",
      });
    }

    const auction = await Auction.findOne({
      _id: auctionId,
      status: ENUM_AUCTION_STATUS.ACTIVE,
    }).populate({
      path: "bidHistory.user",
    });

    if (!auction) {
      io.to(userId).emit("socket-error", {
        errorMessage: "This auction is not active right now",
      });
      throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
    }

    const user = await User.findById(userId).select("availableBid");
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.availableBid < auction?.reservedBid) {
      io.to(userId).emit("socket-error", {
        errorMessage: "You don't have available bids",
      });
      return;
    }

    await User.findByIdAndUpdate(userId, {
      $inc: { availableBid: -auction?.reservedBid },
    });

    const newBidAmount = auction.currentPrice + auction.incrementValue;

    const newBid = {
      user: userId,
      bidAmount: newBidAmount,
    };
    auction.bidHistory.push(newBid);

    // Update the auction details
    auction.currentPrice = newBidAmount;
    auction.totalBidPlace += 1;
    auction.winingBidder = newBid;

    // Set activateTime to 9 seconds ago
    const currentTime = new Date();
    auction.activateTime = new Date(currentTime.getTime() + 9 * 1000);

    //save auction
    await auction.save();

    const updatedAuction = await getUpdatedAuction(auctionId);
    io.to(auctionId).emit("bidHistory", { updatedAuction });
    socket.broadcast.emit("updated-auction", { updatedAuction });
    io.to(auctionId).emit("bidPlaced", newBid);
  });
};

module.exports = handleManualBid;
