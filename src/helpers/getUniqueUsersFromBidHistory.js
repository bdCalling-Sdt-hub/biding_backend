const mongoose = require("mongoose");
const Auction = require("../app/modules/auction/auction.model");

// Function to get unique users from bid history
const getUniqueUsersFromBidHistory = async (auctionId) => {
  try {
    const result = await Auction.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(auctionId) },
      },
      {
        $unwind: "$bidHistory",
      },
      {
        $group: {
          _id: "$bidHistory.user",
          bidAmount: { $first: "$bidHistory.bidAmount" },
        },
      },
      {
        $lookup: {
          from: "users", // The collection name for User
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          profile_image: { $arrayElemAt: ["$userDetails.profile_image", 0] },
          name: { $arrayElemAt: ["$userDetails.name", 0] },
          bidAmount: 1,
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error("Error fetching unique users from bid history:", error);
    throw error;
  }
};

module.exports = getUniqueUsersFromBidHistory;
