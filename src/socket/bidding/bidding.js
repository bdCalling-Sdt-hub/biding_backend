const Auction = require("../../app/modules/auction/auction.model");

const handleBidding = async (io, socket) => {
  // join the auction
  socket.on("joinAuction", async (auctionId) => {
    socket.join(auctionId);
    const auction = await Auction.findById(auctionId);
    io.to(auctionId).emit("auctionData", auction);
  });

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
    } else {
      // Update existing user in bidBuddyUsers
      await Auction.findOneAndUpdate(
        { _id: auctionId, "bidBuddyUsers.user": userId },
        {
          $set: {
            "bidBuddyUsers.$.isActive": true,
            "bidBuddyUsers.&.availableBids":
              existsUser?.availableBids + totalBids,
          },
        },
        { new: true }
      );
    }

    const updatedAuction = await Auction.findById(auctionId).select(
      "bidBuddyUsers"
    );
    io.to(auctionId).emit("bidBuddyUpdated", updatedAuction.bidBuddyUsers);
  });

  // stop bid buddy
  socket.on("stopBidBuddy", async ({ auctionId, userId }) => {
    const updatedAuction = await Auction.findOneAndUpdate(
      { _id: auctionId, "bidBuddyUsers.user": userId },
      { $set: { "bidBuddyUsers.$.isActive": false } },
      { new: true }
    ).select("bidBuddyUsers");

    if (updatedAuction) {
      io.to(auctionId).emit("bidBuddyUpdated", updatedAuction.bidBuddyUsers);
    }
  });
};

module.exports = handleBidding;
