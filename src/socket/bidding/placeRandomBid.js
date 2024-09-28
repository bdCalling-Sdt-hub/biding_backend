const Auction = require("../../app/modules/auction/auction.model");
const User = require("../../app/modules/user/user.model");

//   const auction = await Auction.findById(auctionId)
//     .select(
//       "bidBuddyUsers currentPrice incrementValue bidHistory countdownTime reservedBid totalBidPlace winingBidder"
//     )
//     .populate({
//       path: "bidHistory.user",
//       select: "name profile_image",
//     });

//   const activeBidBuddyUsers = auction.bidBuddyUsers.filter(
//     (user) => user.isActive && user.availableBids > 0
//   );

//   if (activeBidBuddyUsers.length > 0) {
//     // Pick a random user
//     const randomUser =
//       activeBidBuddyUsers[
//         Math.floor(Math.random() * activeBidBuddyUsers.length)
//       ];

//     const newBidAmount = auction.currentPrice + auction.incrementValue;

//     randomUser.availableBids -= auction?.reservedBid;
//     // update the user data-----------
//     const user = await User.findById(randomUser?.user).select("availableBid");
//     await User.findByIdAndUpdate(randomUser?.user, {
//       availableBid: user?.availableBid - auction?.reservedBid,
//     });
//     if (randomUser.availableBids === 0) {
//       randomUser.isActive = false;
//     }

//     auction.currentPrice = newBidAmount;
//     const newBid = {
//       user: randomUser?.user,
//       bidAmount: newBidAmount,
//     };
//     auction?.bidHistory?.push(newBid);
//     auction?.totalBidPlace = auction?.totalBidPlace + 1;
//     auction?.winingBidder = newBid;
//     auction.countdownTime = 9;

//     await auction.save();

//     const updatedBidHistory = auction.bidHistory.slice(-10).reverse();

//     io.to(auctionId).emit("updateCountdown", {
//       countdownTime: auction.countdownTime,
//     });

//     io.to(auctionId).emit("bidHistory", updatedBidHistory);

//     io.to(auctionId).emit("bidPlaced", newBid);
//   } else {
//     io.to(auctionId).emit("noActiveBidders", "No active bidders remaining.");
//   }
// };
const placeRandomBid = async (auctionId) => {
  try {
    const auction = await Auction.findById(auctionId)
      .select(
        "bidBuddyUsers currentPrice incrementValue bidHistory countdownTime reservedBid totalBidPlace winingBidder"
      )
      .populate({
        path: "bidHistory.user",
        select: "name profile_image location _id",
      });

    if (!auction) {
      throw new Error("Auction not found");
    }

    const activeBidBuddyUsers = auction.bidBuddyUsers.filter(
      (user) => user.isActive && user.availableBids > 0
    );

    if (activeBidBuddyUsers.length > 0) {
      // Pick a random user
      const randomUser =
        activeBidBuddyUsers[
          Math.floor(Math.random() * activeBidBuddyUsers.length)
        ];

      const newBidAmount = auction.currentPrice + auction.incrementValue;

      const userUpdate = await User.findByIdAndUpdate(
        randomUser.user,
        {
          $inc: { availableBid: -auction?.reservedBid },
        },
        { new: true, select: "availableBid" }
      );

      if (!userUpdate || userUpdate.availableBid < 0) {
        throw new Error("Insufficient available bids");
      }

      // Deactivate the user if they run out of bids
      if (userUpdate.availableBid === 0) {
        randomUser.isActive = false;
      }

      // Update the auction details atomically
      const updatedAuction = await Auction.findByIdAndUpdate(
        auctionId,
        {
          $set: {
            currentPrice: newBidAmount,
            countdownTime: 9,
            winingBidder: {
              user: randomUser?.user,
              bidAmount: newBidAmount,
            },
          },
          $push: {
            bidHistory: {
              user: randomUser?.user,
              bidAmount: newBidAmount,
            },
          },
          $inc: { totalBidPlace: 1 },
        },
        { new: true }
      )
        .populate({
          path: "bidHistory.user",
        })
        .populate({ path: "bidBuddyUsers.user" });

      // Get the updated bid history (last 10 bids)
      const updatedBidHistory = updatedAuction.bidHistory.slice(-10).reverse();

      io.to(auctionId).emit("updateCountdown", {
        countdownTime: updatedAuction.countdownTime,
      });

      io.to(auctionId).emit("bidHistory", updatedBidHistory);

      io.to(auctionId).emit("bidPlaced", {
        user: randomUser?.user,
        bidAmount: newBidAmount,
      });
    } else {
      io.to(auctionId).emit("noActiveBidders", "No active bidders remaining.");
    }
  } catch (error) {
    console.error("Error placing bid:", error);
    io.to(auctionId).emit("error", "Error placing bid");
  }
};

module.exports = placeRandomBid;
