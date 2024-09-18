const Auction = require("../../app/modules/auction/auction.model");

const placeRandomBid = async (auctionId) => {
  const auction = await Auction.findById(auctionId)
    .select(
      "bidBuddyUsers currentPrice incrementValue bidHistory countdownTime"
    )
    .populate({
      path: "bidHistory.user",
      select: "name profile_image",
    });

  const activeBidBuddyUsers = auction.bidBuddyUsers.filter(
    (user) => user.isActive && user.availableBids > 0
  );

  if (activeBidBuddyUsers.length > 0) {
    // Pick a random user
    const randomUser =
      activeBidBuddyUsers[
        Math.floor(Math.random() * activeBidBuddyUsers.length)
      ];

    // Calculate new bid amount
    const newBidAmount = auction.currentPrice + auction.incrementValue;

    randomUser.availableBids -= 1;
    if (randomUser.availableBids === 0) {
      randomUser.isActive = false;
    }

    auction.currentPrice = newBidAmount;
    const newBid = {
      user: randomUser?.user,
      bidAmount: newBidAmount,
    };
    auction?.bidHistory?.push(newBid);

    auction.countdownTime = 9;

    await auction.save();

    const updatedBidHistory = auction.bidHistory.slice(-10);

    io.to(auctionId).emit("updateCountdown", {
      countdownTime: auction.countdownTime,
    });

    io.to(auctionId).emit("bidHistory", updatedBidHistory);

    io.to(auctionId).emit("bidPlaced", newBid);
  } else {
    io.to(auctionId).emit("noActiveBidders", "No active bidders remaining.");
  }
};

module.exports = placeRandomBid;
