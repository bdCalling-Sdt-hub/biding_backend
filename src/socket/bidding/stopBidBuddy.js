const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const getUpdatedAuction = require("../../helpers/getUpdatedAuctiion");

const stopBidBuddy = async (io, socket) => {
  socket.on("stopBidBuddy", async ({ auctionId, userId, totalBids }) => {
    console.log("stop bid buddy", auctionId, userId, totalBids);
    try {
      const updateAuction = await Auction.findOneAndUpdate(
        { _id: auctionId, "bidBuddyUsers.user": userId },
        {
          $set: {
            "bidBuddyUsers.$.isActive": false,
            "bidBuddyUsers.$.availableBids": 0,
          },
        },
        { new: true }
      ).select("bidBuddyUsers");
      console.log("updated auction",updateAuction)

      await User.findByIdAndUpdate(userId, {
        $inc: { availableBid: totalBids },
      });
      const updatedAuction = await getUpdatedAuction(auctionId);
      io.to(auctionId).emit("bidHistory", { updatedAuction });
      socket.broadcast.emit("updated-auction", { updatedAuction });
    } catch (error) {
      console.error("Error updating bidBuddy status:", error);
    }
  });
};

module.exports = stopBidBuddy;
