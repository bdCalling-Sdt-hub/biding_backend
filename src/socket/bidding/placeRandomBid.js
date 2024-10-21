const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const getUpdatedAuction = require("../../helpers/getUpdatedAuctiion");
const placeRandomBid = async (auctionId) => {
  console.log("auction id from random bit", auctionId);
  try {
    const auction = await Auction.findById(auctionId)
      .select(
        "bidBuddyUsers currentPrice incrementValue bidHistory countdownTime reservedBid totalBidPlace winingBidder"
      )
      .populate({
        path: "bidHistory.user",
        select: "name profile_image location _id",
      });

    if (!auction) {
      throw new Error("Auction not found");
    }

    const activeBidBuddyUsers = auction.bidBuddyUsers.filter(
      (user) => user.isActive && user.availableBids > 0
    );

    if (activeBidBuddyUsers.length > 0) {
      // Pick a random user
      const randomUser =
        activeBidBuddyUsers[
          Math.floor(Math.random() * activeBidBuddyUsers.length)
        ];

      const newBidAmount = auction.currentPrice + auction.incrementValue;
      console.log("new bid from random", newBidAmount);
      const userUpdate = await User.findByIdAndUpdate(
        randomUser.user,
        {
          $inc: { availableBid: -auction?.reservedBid },
        },
        { new: true, select: "availableBid" }
      );

      if (!userUpdate || userUpdate.availableBid < 0) {
        throw new Error("Insufficient available bids");
      }

      // Deactivate the user if they run out of bids
      if (userUpdate.availableBid === 0) {
        randomUser.isActive = false;
      }
      const currentTime = new Date();
      const nineSecondsAgo = new Date(currentTime.getTime() - 9 * 1000);
      // Update the auction details atomically
      const updateAuction = await Auction.findByIdAndUpdate(
        auctionId,
        {
          $set: {
            currentPrice: newBidAmount,
            activateTime: nineSecondsAgo,
            winingBidder: {
              user: randomUser?.user,
              bidAmount: newBidAmount,
            },
          },
          $push: {
            bidHistory: {
              user: randomUser?.user,
              bidAmount: newBidAmount,
            },
          },
          $inc: { totalBidPlace: 1 },
        },
        { new: true }
      )
        .populate({
          path: "bidHistory.user",
        })
        .populate({ path: "bidBuddyUsers.user" });

      // const updatedAuction = await Auction.findById(auctionId)
      //   .populate({
      //     path: "bidHistory.user",
      //   })
      //   .populate({ path: "bidBuddyUsers.user" });
      const updatedAuction = await getUpdatedAuction(auctionId);
      global.io.to(auctionId).emit("bidHistory", { updatedAuction });
      // socket.broadcast.emit("updated-auction", { updatedAuction });
      global.io.emit("updated-auction", { updatedAuction });
    } else {
      io.to(auctionId).emit("noActiveBidders", "No active bidders remaining.");
    }
  } catch (error) {
    io.to(auctionId).emit("socket-error", "Error placing bid");
  }
};

module.exports = placeRandomBid;
