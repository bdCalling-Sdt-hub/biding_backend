const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");
const handleCountdown = require("./handleCountdown");
const handleManualBid = require("./handleManualBid");

const handleBidding = async (io, socket) => {
  // join the auction
  socket.on("joinAuction", async (auctionId) => {
    socket.join(auctionId);
    const auction = await Auction.findById(auctionId);
    io.to(auctionId).emit("auctionData", auction);
  });

  // handle manual bit
  handleManualBid(io, socket);

  // activate bid buddy -----------
  socket.on("activateBidBuddy", async (auctionId, userId, totalBids) => {
    const auction = await Auction.findById(auctionId).select("bidBuddyUsers");
    const existsUser = auction.bidBuddyUsers.find((user) => user === userId);

    if (!existsUser) {
      // Add new user to bidBuddyUsers
      await Auction.findByIdAndUpdate(
        auctionId,
        {
          $push: {
            bidBuddyUsers: {
              user: userId,
              availableBids: totalBids,
              isActive: true,
            },
          },
        },
        { new: true }
      );
      // get user
      const userData = await User.findById(userId).select("availableBid");
      // update user
      await User.findByIdAndUpdate(userId, {
        availableBid: userData?.availableBid - totalBids,
      });
    } else {
      // Update existing user in bidBuddyUsers
      await Auction.findOneAndUpdate(
        { _id: auctionId, "bidBuddyUsers.user": userId },
        {
          $set: {
            "bidBuddyUsers.$.isActive": true,
            "bidBuddyUsers.&.availableBids": totalBids,
          },
        },
        { new: true }
      );
      // get user
      const userData = await User.findById(userId).select("availableBid");
      // update user
      await User.findByIdAndUpdate(userId, {
        availableBid: userData?.availableBid - totalBids,
      });
    }

    const updatedAuction = await Auction.findById(auctionId).select(
      "bidBuddyUsers"
    );
    io.to(auctionId).emit("bidBuddyUpdated", updatedAuction.bidBuddyUsers);
  });

  // stop bid buddy-------------------
  socket.on("stopBidBuddy", async (auctionId, userId) => {
    try {
      const updatedAuction = await Auction.findOneAndUpdate(
        { _id: auctionId, "bidBuddyUsers.user._id": userId },
        {
          $set: {
            "bidBuddyUsers.$.isActive": false,
            "bidBuddyUsers.$.availableBids": 0,
          },
        },
        { new: true }
      ).select("bidBuddyUsers");

      if (updatedAuction) {
        io.to(auctionId).emit("bidBuddyUpdated", updatedAuction.bidBuddyUsers);
      }
    } catch (error) {
      console.error("Error updating bidBuddy status:", error);
    }
  });

  // start bidding
  socket.on("startBidding", async (auctionId) => {
    try {
      const auction = await Auction.findById(auctionId).select(
        "status countdownTime"
      );

      if (!auction) {
        return io.to(auctionId).emit("auctionError", "Auction not found.");
      }

      // Update auction status and reset countdown time
      auction.status = ENUM_AUCTION_STATUS.ACTIVE;
      auction.countdownTime = 9;

      // Save auction changes in one operation
      await auction.save();

      // Emit updated countdown to the auction room
      io.to(auctionId).emit("updateCountdown", {
        countdownTime: auction.countdownTime,
      });

      // Start the countdown for bidding
      handleCountdown(auctionId);
    } catch (error) {
      console.error("Error starting the auction:", error);
      io.to(auctionId).emit("auctionError", "Error starting the auction.");
    }
  });
};

module.exports = handleBidding;
