const httpStatus = require("http-status");
const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const ApiError = require("../../errors/ApiError");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");

const handleManualBid = async (io, socket) => {
  socket.on("place-manual-bid", async (data) => {
    // console.log("emited", auctionId);
    // console.log("userid", userId);
    console.log("dat", data);
    const auctionId = data?.auction_id;
    const userId = data?.user_id;
    // try {
    const auction = await Auction.findOne({
      _id: auctionId,
      status: ENUM_AUCTION_STATUS.ACTIVE,
    })
      //   .select(
      //     "bidBuddyUsers currentPrice incrementValue bidHistory countdownTime reservedBid totalBidPlace winingBidder"
      //   )
      .populate({
        path: "bidHistory.user",
        // select: "name profile_image",
      });

    if (!auction) {
      throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
    }

    console.log("auction", auction);

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
    //auction.countdownTime = 9;

    // Set activateTime to 9 seconds ago
    const currentTime = new Date();
    auction.activateTime = new Date(currentTime.getTime() - 9 * 1000);

    //save auction
    await auction.save();

    console.log("updatedAuction", auction);
    // here send just last 10 history
    const updatedBidHistory = auction.bidHistory.slice(-10).reverse();

    // Emit the updates to all clients in the auction room
    // io.to(auctionId).emit("updateCountdown", {
    //   countdownTime: auction.countdownTime,
    // });

    const updatedAuction = await Auction.findById(auctionId)
      .populate({
        path: "bidHistory.user",
      })
      .populate({ path: "bidBuddyUsers.user" });

    console.log("aucitonsldkjfd", updatedAuction);
    io.to(auctionId).emit("bidHistory", { updatedAuction });
    // socket.broadcast.emit("updated-auction", { updatedAuction });
    socket.broadcast.emit("updated-auction", { updatedAuction });
    io.to(auctionId).emit("bidPlaced", newBid);
    // }
    // catch (error) {
    //   console.error("Error handling manual bid:", error);
    //   io.to(socket.id).emit("error", "Error placing manual bid");
    // }
  });
};

module.exports = handleManualBid;
