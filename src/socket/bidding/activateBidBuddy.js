const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const getUpdatedAuction = require("../../helpers/getUpdatedAuctiion");

const activateBidBuddy = async (io, socket) => {
  socket.on("activateBidBuddy", async ({ auctionId, userId, totalBids }) => {
    const auction = await Auction.findById(auctionId).select("bidBuddyUsers");
    const existsUser = auction.bidBuddyUsers.find(
      (user) => user?.user?.toString() === userId
    );

    console.log("existsuser", existsUser);
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
      const updateAuction = await Auction.findOneAndUpdate(
        { _id: auctionId, "bidBuddyUsers.user": userId },
        {
          $set: {
            "bidBuddyUsers.$.isActive": true,
            "bidBuddyUsers.$.availableBids": totalBids,
          },
        }
        // { new: true }
      );
      // get user
      const userData = await User.findById(userId).select("availableBid");
      // console.log("userdata form avitivat", userData);
      // update user
      await User.findByIdAndUpdate(userId, {
        availableBid: userData?.availableBid - totalBids,
      });
    }

    // const updatedAuction = await Auction.findById(auctionId);
    // const updatedAuction = await Auction.findById(auctionId)
    //   .populate({
    //     path: "bidHistory.user",
    //     options: { limit: 10 }, // Limit for bidHistory
    //   })
    //   .populate({
    //     path: "bidBuddyUsers.user",
    //     options: { limit: 10 }, // Limit for bidBuddyUsers
    //   });
    const updatedAuction = await getUpdatedAuction(auctionId);
    console.log("Update dkfjd", updatedAuction);
    io.to(auctionId).emit("bidHistory", { updatedAuction });
    socket.broadcast.emit("updated-auction", { updatedAuction });
  });
};

module.exports = activateBidBuddy;
