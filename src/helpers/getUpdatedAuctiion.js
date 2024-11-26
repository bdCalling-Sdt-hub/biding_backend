const { default: mongoose } = require("mongoose");
const Auction = require("../app/modules/auction/auction.model");
const getUniqueUsersFromBidHistory = require("./getUniqueUsersFromBidHistory");

const getUpdatedAuction = async (auctionId, bidHistoryLimit = 5) => {
  try {
    const auction = await Auction.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(auctionId) }, // Match the auction by ID
      },
      {
        $lookup: {
          from: "users", // Ensure the collection name is correct
          localField: "bidBuddyUsers.user",
          foreignField: "_id",
          as: "bidBuddyUsersData",
        },
      },
      {
        $lookup: {
          from: "users", // Ensure the collection name is correct
          localField: "bidHistory.user",
          foreignField: "_id",
          as: "bidHistoryUsers",
        },
      },
      {
        $project: {
          name: 1,
          category: 1,
          reservedBid: 1,
          incrementValue: 1,
          startingDate: 1,
          startingTime: 1,
          description: 1,
          images: 1,
          status: 1,
          currentPrice: 1,
          totalBidPlace: 1,
          countdownTime: 1,
          activateTime: 1,
          endedTime: 1,
          financeAvailable: 1,
          totalMonthForFinance: 1,
          bidBuddyUsers: {
            $map: {
              input: "$bidBuddyUsers",
              as: "bidBuddyUser",
              in: {
                user: "$$bidBuddyUser.user",
                availableBids: "$$bidBuddyUser.availableBids",
                isActive: "$$bidBuddyUser.isActive",
                userInfo: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$bidBuddyUsersData",
                        as: "user",
                        cond: { $eq: ["$$user._id", "$$bidBuddyUser.user"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
          bidHistory: {
            $slice: [
              {
                $map: {
                  input: "$bidHistory",
                  as: "bid",
                  in: {
                    user: "$$bid.user",
                    bidAmount: "$$bid.bidAmount",
                    time: "$$bid.time",
                    userInfo: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$bidHistoryUsers",
                            as: "user",
                            cond: { $eq: ["$$user._id", "$$bid.user"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
              -bidHistoryLimit,
            ],
          },
        },
      },
      {
        $addFields: {
          bidBuddyUsers: {
            $map: {
              input: "$bidBuddyUsers",
              as: "bidBuddyUser",
              in: {
                user: "$$bidBuddyUser.user",
                availableBids: "$$bidBuddyUser.availableBids",
                isActive: "$$bidBuddyUser.isActive",
                name: { $ifNull: ["$$bidBuddyUser.userInfo.name", null] },
                email: { $ifNull: ["$$bidBuddyUser.userInfo.email", null] },
                profile_image: {
                  $ifNull: ["$$bidBuddyUser.userInfo.profile_image", null],
                },
              },
            },
          },
          bidHistory: {
            $map: {
              input: "$bidHistory",
              as: "bid",
              in: {
                user: "$$bid.user",
                bidAmount: "$$bid.bidAmount",
                time: "$$bid.time",
                name: { $ifNull: ["$$bid.userInfo.name", null] },
                username: { $ifNull: ["$$bid.userInfo.username", null] },
                email: { $ifNull: ["$$bid.userInfo.email", null] },
                profile_image: {
                  $ifNull: ["$$bid.userInfo.profile_image", null],
                },
                location: {
                  $ifNull: ["$$bid.userInfo.location", null],
                },
              },
            },
          },
        },
      },
    ]);

    if (!auction || auction.length === 0) {
      throw new Error("Auction not found");
    }

    const uniqueBidders = await getUniqueUsersFromBidHistory(auctionId);
    // return auction[0];
    return {
      ...auction[0],
      uniqueBidders,
    };
  } catch (error) {
    console.error("Error fetching auction:", error);
    throw error;
  }
};

module.exports = getUpdatedAuction;
