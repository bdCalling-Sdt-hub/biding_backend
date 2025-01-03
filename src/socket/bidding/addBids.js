const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const getUpdatedAuction = require("../../helpers/getUpdatedAuctiion");

const addBids = async (io, socket) => {
  socket.on("add-bids", async ({ auctionId, userId, bids }) => {
    console.log("add bids",auctionId,userId,bids)
    const existUser = await User.findById(userId);
    if (existUser.availableBid < bids) {
      io.to(userId).emit("socket-error", {
        errorMessage: "You don't have available bids",
      });
      return;
    }
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
        },
        $inc: { "bidBuddyUsers.$.availableBids": bids },
      }
    );

    // user user data
    await User.findByIdAndUpdate(userId, { $inc: { availableBid: -bids } });

    const updatedAuction = await getUpdatedAuction(auctionId);

    io.to(auctionId).emit("bidHistory", { updatedAuction });
    socket.broadcast.emit("updated-auction", { updatedAuction });
  });
};

module.exports = addBids;
