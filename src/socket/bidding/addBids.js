const Auction = require("../../app/modules/auction/auction.model");
const getUpdatedAuction = require("../../helpers/getUpdatedAuctiion");

const addBids = async (io, socket) => {
  socket.on("add-bids", async ({ auctionId, userId, bids }) => {
    const auction = await Auction.findById(auctionId).select("bidBuddyUsers");
    const existsUser = auction.bidBuddyUsers.find(
      (user) => user?.user?.toString() === userId
    );
    if (!existsUser) {
      io.to(userId).emit("socket-error", {
        errorMessage: "Your buddy is not active right now",
      });
    }
    await Auction.findOneAndUpdate(
      { _id: auctionId, "bidBuddyUsers.user": userId },
      {
        $set: {
          "bidBuddyUsers.$.isActive": true,
          //   "bidBuddyUsers.&.availableBids": bids,
        },
        $inc: { "bidBuddyUsers.$.availableBids": bids },
      }
      //   { new: true }
    );

    // const updatedAuction = await Auction.findById(auctionId)
    //   .populate({
    //     path: "bidHistory.user",
    //   })
    //   .populate({ path: "bidBuddyUsers.user" });

    const updatedAuction = await getUpdatedAuction(auctionId);

    io.to(auctionId).emit("bidHistory", { updatedAuction });
    // socket.broadcast.emit("updated-auction", { updatedAuction });
    socket.broadcast.emit("updated-auction", { updatedAuction });
  });
};

module.exports = addBids;
