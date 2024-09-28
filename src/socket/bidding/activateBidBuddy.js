const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");

const activateBidBuddy = async (io, socket) => {
  socket.on("activateBidBuddy", async ({ auctionId, userId, totalBids }) => {
    const auction = await Auction.findById(auctionId).select("bidBuddyUsers");
    const existsUser = auction.bidBuddyUsers.find(
      (user) => user?.user?.toString() === userId
    );

    console.log("is exists", existsUser);
    if (!existsUser) {
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
      console.log("userdata form avitivat", userData);
      // update user
      await User.findByIdAndUpdate(userId, {
        availableBid: userData?.availableBid - totalBids,
      });
    }

    const updatedAuction = await Auction.findById(auctionId);
    io.to(auctionId).emit("bidHistory", { updatedAuction });
    socket.broadcast.emit("updated-auction", { updatedAuction });
  });
};

module.exports = activateBidBuddy;
