const Auction = require("../../app/modules/auction/auction.model");

const stopBidBuddy = async (io, socket) => {
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

      //   if (updatedAuction) {
      //     io.to(auctionId).emit("bidBuddyUpdated", updatedAuction.bidBuddyUsers);
      //   }
    } catch (error) {
      console.error("Error updating bidBuddy status:", error);
    }
  });
};

module.exports = stopBidBuddy;
