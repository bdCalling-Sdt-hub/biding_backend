const { default: mongoose } = require("mongoose");
const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");
const getUpdatedAuction = require("../../helpers/getUpdatedAuctiion");
const { ENUM_AUCTION_STATUS } = require("../../utils/enums");

const activateBidBuddy = async (io, socket) => {
  socket.on("activateBidBuddy", async ({ auctionId, userId, totalBids }) => {
    const existUser = await User.findById(userId);
    if (existUser.availableBid < totalBids) {
      io.to(userId).emit("socket-error", {
        errorMessage: "You don't have available bids",
      });
      return;
    }

    const auction = await Auction.findById(auctionId).select(
      "bidBuddyUsers status"
    );

    if (auction.status !== ENUM_AUCTION_STATUS.ACTIVE) {
      io.to(userId).emit("socket-error", {
        errorMessage:
          "You can activate the bid buddy when the auction is active",
      });
      return;
    }

    const existsUser = auction.bidBuddyUsers.find(
      (user) => user?.user?.toString() === userId
    );
    const currentTime = new Date();
    const nineSecondsFromNow = new Date(currentTime.getTime() + 9 * 1000);
    if (!existsUser) {
      // await Auction.findByIdAndUpdate(
      //   auctionId,
      //   {
      //     $push: {
      //       bidBuddyUsers: {
      //         user: userId,
      //         availableBids: totalBids,
      //         isActive: true,
      //       },
      //     },

      //     activateTime: new Date(currentTime.getTime() + 9 * 1000),
      //   },
      //   { new: true }
      // );
      await Auction.findByIdAndUpdate(
        auctionId,
        {
          $push: {
            bidBuddyUsers: {
              user: new mongoose.Types.ObjectId(userId), // Ensure ObjectId format
              availableBids: totalBids,
              isActive: true,
            },
          },
          // Conditionally update activateTime only if it's within 9 seconds of the current time
          $set: {
            activateTime: {
              $cond: {
                if: { $lte: ["$activateTime", nineSecondsFromNow] },
                then: new Date(currentTime.getTime() + 9 * 1000),
                else: "$activateTime", // Keep the existing value if condition is not met
              },
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
      );
      // get user
      const userData = await User.findById(userId).select("availableBid");
      // update user
      await User.findByIdAndUpdate(userId, {
        availableBid: userData?.availableBid - totalBids,
      });
    }

    const updatedAuction = await getUpdatedAuction(auctionId);
    io.to(auctionId).emit("bidHistory", { updatedAuction });
    socket.broadcast.emit("updated-auction", { updatedAuction });
  });
};

module.exports = activateBidBuddy;
