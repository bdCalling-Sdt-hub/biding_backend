const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");
const activateBidBuddy = require("./activateBidBuddy");
const addBids = require("./addBids");
const handleBidEnded = require("./handleBidEnded");
const handleCountdown = require("./handleCountdown");
const handleManualBid = require("./handleManualBid");
const stopBidBuddy = require("./stopBidBuddy");

const handleBidding = async (io, socket) => {
  // join the auction
  socket.on("joinAuction", async (auctionId) => {
    console.log("join auction", auctionId);
    socket.join(auctionId);
    const auction = await Auction.findById(auctionId);
    io.to(auctionId).emit("auctionData", auction);
  });

  // handle manual bit
  // await handleManualBid(io, socket);

  // handle ended bid
  // handleBidEnded(io, socket);

  // activate bid buddy -----------
  // activateBidBuddy(io, socket);

  // addBids(io, socket);

  // stop bid buddy-------------------
  // socket.on("stopBidBuddy", async (auctionId, userId) => {
  //   try {
  //     const updatedAuction = await Auction.findOneAndUpdate(
  //       { _id: auctionId, "bidBuddyUsers.user._id": userId },
  //       {
  //         $set: {
  //           "bidBuddyUsers.$.isActive": false,
  //           "bidBuddyUsers.$.availableBids": 0,
  //         },
  //       },
  //       { new: true }
  //     ).select("bidBuddyUsers");

  //     if (updatedAuction) {
  //       io.to(auctionId).emit("bidBuddyUpdated", updatedAuction.bidBuddyUsers);
  //     }
  //   } catch (error) {
  //     console.error("Error updating bidBuddy status:", error);
  //   }
  // });

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
