const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");
const placeRandomBid = require("./placeRandomBid");

const handleCountdown = async (auctionId) => {
  const auction = await Auction.findById(auctionId);
  const countdownInterval = setInterval(async () => {
    if (auction.countdownTime <= 0) {
      clearInterval(countdownInterval);
      // Handle auction end logic
      if (auction.bidHistory.length > 0) {
        const highestBid = auction.bidHistory[auction.bidHistory.length - 1];
        const user = await User.findById(highestBid.user).select("totalWin");
        await User.findByIdAndUpdate(highestBid.user, {
          totalWin: user?.totalWin + 1,
        });
        io.to(auctionId).emit("auctionEnded", {
          winner: highestBid.user,
          finalPrice: auction.currentPrice,
        });
      } else {
        io.to(auctionId).emit("auctionEnded", {
          message: "No bids placed, auction ended.",
        });
      }
      auction.status = ENUM_AUCTION_STATUS.COMPLETED;
      await auction.save();
      return;
    }

    if (auction.countdownTime <= 5) {
      await placeRandomBid(auctionId);
    }

    // reduce the countdown ------------
    auction.countdownTime -= 1;
    auction.lastUpdated = new Date();
    await auction.save();
    io.to(auctionId).emit("updateCountdown", {
      countdownTime: auction.countdownTime,
    });
  }, 1000);
};

module.exports = handleCountdown;
