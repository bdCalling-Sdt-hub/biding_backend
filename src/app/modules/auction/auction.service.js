const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const {
  sendImageToCloudinary,
} = require("../../../helpers/sendImageToCloudinary");
const Auction = require("./auction.model");
const QueryBuilder = require("../../../builder/QueryBuilder");
const createNotification = require("../../../helpers/createNotification");
const getUnseenNotificationCount = require("../../../helpers/getUnseenNotification");
const { default: mongoose } = require("mongoose");
const { ENUM_AUCTION_STATUS, ENUM_USER_ROLE } = require("../../../utils/enums");
const Bookmark = require("../bookmark/bookmark.model");
const handleCountdown = require("../../../socket/bidding/handleCountdown");
const Notification = require("../notification/notification.model");
const cron = require("node-cron");
const getAuctionEmailTemplate = require("../../../helpers/getAuctionEmailTemplate");
const { sendEmail } = require("../../../utils/sendEmail");
const getAdminNotificationCount = require("../../../helpers/getAdminNotificationCount");
const placeRandomBid = require("../../../socket/bidding/placeRandomBid");
// const mongoose = require("mongoose");
const createAuctionIntoDB = async (data) => {
  const startingDate = new Date(data.startingDate);
  const [hours, minutes] = data.startingTime.split(":");
  console.log("data is real", data);

  startingDate.setHours(hours, minutes);

  data.activateDateTime = startingDate;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Format the starting date and time
    data.activateTime = startingDate;
    if (startingDate <= new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Please add future date");
    }

    const result = await Auction.create([data], { session });
    if (!result || result.length === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Auction not created, try again"
      );
    }

    const [hours, minutes] = data.startingTime.split(":");
    startingDate.setHours(hours, minutes);

    // Format the date and time to a readable format
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    const formattedDate = startingDate.toLocaleDateString("en-US", options);
    const notificationMessage = `${data?.name} has been successfully created and scheduled to start on ${formattedDate}.`;
    // await createNotification(
    //   { notificationMessage, receiver: ENUM_USER_ROLE.ADMIN },
    //   session
    // );
    await Notification.create({
      message: notificationMessage,
      receiver: ENUM_USER_ROLE.ADMIN,
    });

    // send notifications to the admin
    const adminUnseenNotificationCount = await getAdminNotificationCount();
    global.io.emit("admin-notifications", adminUnseenNotificationCount);

    await session.commitTransaction();
    session.endSession();

    return result;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof mongoose.Error.ValidationError) {
      // Handle Mongoose validation error
      const messages = Object.values(err.errors).map((error) => error.message);
      throw new ApiError(httpStatus.BAD_REQUEST, messages.join(", "));
    }

    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Something went wrong. Try again later."
    );
  }
};

const getAllAuctionFromDB = async (query, userId) => {
  const auctionQuery = new QueryBuilder(Auction.find(), query)
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();
  auctionQuery.modelQuery = auctionQuery.modelQuery
    .populate({
      path: "bidBuddyUsers.user",
      select: "name profile_image",
    })
    .populate({
      path: "bidHistory.user",
      select: "name profile_image",
    })
    .populate({
      path: "winingBidder.user",
      select: "name profile_image",
    });

  const result = await auctionQuery.modelQuery;
  const meta = await auctionQuery.countTotal();

  const bookmarks = await Bookmark.find({ user: userId }).select("auction");
  const bookmarkedAuctionIds = new Set(
    bookmarks.map((b) => b.auction.toString())
  );

  const enrichedResult = result.map((auction) => ({
    ...auction.toObject(),
    isBookmark: bookmarkedAuctionIds.has(auction._id.toString()),
  }));

  return { meta, result: enrichedResult };
};

// get single auction
// const getSingleAuctionFromDB = async (id) => {
//   const result = await Auction.findById(id)
//     .populate({
//       path: "bidBuddyUsers",
//       options: { limit: 10 },
//       populate: {
//         path: "user",
//         model: "User",
//       },
//     })
//     .populate({
//       path: "bidHistory",
//       populate: {
//         path: "user",
//         model: "User",
//       },
//     });

//   if (!result) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
//   }

//   // Manually limit the bidHistory to the first 5 entries
//   result.bidHistory = result.bidHistory.slice(0, 5);

//   return result;
// };
// const getSingleAuctionFromDB = async (auctionId, bidHistoryLimit = 5) => {
//   try {
//     const auction = await Auction.findById(auctionId)
//       .populate("bidBuddyUsers.user", "name email profile_image") // Populate user in bidBuddyUsers
//       .populate("bidHistory.user", "name email profile_image"); // Populate user in bidHistory

//     if (!auction) {
//       throw new Error("Auction not found");
//     }

//     // Limit the bidHistory to the last specified limit
//     auction.bidHistory = auction.bidHistory.slice(-bidHistoryLimit);

//     return auction;
//   } catch (error) {
//     console.error("Error fetching auction:", error);
//     throw error;
//   }
// };
// const getSingleAuctionFromDB = async (auctionId, bidHistoryLimit = 5) => {
//   try {
//     const auction = await Auction.aggregate([
//       {
//         $match: { _id: new mongoose.Types.ObjectId(auctionId) }, // Match the auction by ID
//       },
//       {
//         $lookup: {
//           from: "users", // Ensure the collection name is correct
//           localField: "bidBuddyUsers.user",
//           foreignField: "_id",
//           as: "bidBuddyUsers",
//         },
//       },
//       {
//         $lookup: {
//           from: "users", // Ensure the collection name is correct
//           localField: "bidHistory.user",
//           foreignField: "_id",
//           as: "bidHistoryUsers",
//         },
//       },
//       {
//         $project: {
//           name: 1,
//           category: 1,
//           reservedBid: 1,
//           incrementValue: 1,
//           startingDate: 1,
//           startingTime: 1,
//           description: 1,
//           images: 1,
//           status: 1,
//           currentPrice: 1,
//           totalBidPlace: 1,
//           countdownTime: 1,
//           activateTime: 1,
//           endedTime: 1,
//           financeAvailable: 1,
//           totalMonthForFinance: 1,
//           bidBuddyUsers: {
//             $map: {
//               input: "$bidBuddyUsers",
//               as: "user",
//               in: {
//                 user: "$$user.user",
//                 name: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$bidHistoryUsers",
//                         as: "historyUser",
//                         cond: { $eq: ["$$historyUser._id", "$$user.user"] },
//                       },
//                     },
//                     0,
//                   ],
//                 }.name,
//                 email: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$bidHistoryUsers",
//                         as: "historyUser",
//                         cond: { $eq: ["$$historyUser._id", "$$user.user"] },
//                       },
//                     },
//                     0,
//                   ],
//                 }.email,
//                 profile_image: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$bidHistoryUsers",
//                         as: "historyUser",
//                         cond: { $eq: ["$$historyUser._id", "$$user.user"] },
//                       },
//                     },
//                     0,
//                   ],
//                 }.profile_image,
//               },
//             },
//           },
//           bidHistory: { $slice: ["$bidHistory", -bidHistoryLimit] },
//         },
//       },
//     ]);

//     if (!auction || auction.length === 0) {
//       throw new Error("Auction not found");
//     }

//     return auction[0]; // Return the first (and only) auction object
//   } catch (error) {
//     console.error("Error fetching auction:", error);
//     throw error;
//   }
// };
// const getSingleAuctionFromDB = async (auctionId, bidHistoryLimit = 5) => {
//   try {
//     const auction = await Auction.aggregate([
//       {
//         $match: { _id: new mongoose.Types.ObjectId(auctionId) }, // Match the auction by ID
//       },
//       {
//         $lookup: {
//           from: "users", // Ensure the collection name is correct
//           localField: "bidBuddyUsers.user",
//           foreignField: "_id",
//           as: "bidBuddyUsersData",
//         },
//       },
//       {
//         $lookup: {
//           from: "users", // Ensure the collection name is correct
//           localField: "bidHistory.user",
//           foreignField: "_id",
//           as: "bidHistoryUsers",
//         },
//       },
//       {
//         $project: {
//           name: 1,
//           category: 1,
//           reservedBid: 1,
//           incrementValue: 1,
//           startingDate: 1,
//           startingTime: 1,
//           description: 1,
//           images: 1,
//           status: 1,
//           currentPrice: 1,
//           totalBidPlace: 1,
//           countdownTime: 1,
//           activateTime: 1,
//           endedTime: 1,
//           financeAvailable: 1,
//           totalMonthForFinance: 1,
//           bidBuddyUsers: {
//             $map: {
//               input: "$bidBuddyUsers",
//               as: "bidBuddyUser",
//               in: {
//                 user: "$$bidBuddyUser.user",
//                 availableBids: "$$bidBuddyUser.availableBids",
//                 isActive: "$$bidBuddyUser.isActive",
//                 userInfo: {
//                   $arrayElemAt: [
//                     {
//                       $filter: {
//                         input: "$bidBuddyUsersData",
//                         as: "user",
//                         cond: { $eq: ["$$user._id", "$$bidBuddyUser.user"] },
//                       },
//                     },
//                     0,
//                   ],
//                 },
//               },
//             },
//           },
//           bidHistory: { $slice: ["$bidHistory", -bidHistoryLimit] },
//         },
//       },
//       {
//         $addFields: {
//           bidBuddyUsers: {
//             $map: {
//               input: "$bidBuddyUsers",
//               as: "bidBuddyUser",
//               in: {
//                 user: "$$bidBuddyUser.user",
//                 availableBids: "$$bidBuddyUser.availableBids",
//                 isActive: "$$bidBuddyUser.isActive",
//                 name: { $ifNull: ["$$bidBuddyUser.userInfo.name", null] },
//                 email: { $ifNull: ["$$bidBuddyUser.userInfo.email", null] },
//                 profile_image: {
//                   $ifNull: ["$$bidBuddyUser.userInfo.profile_image", null],
//                 },
//               },
//             },
//           },
//         },
//       },
//     ]);

//     if (!auction || auction.length === 0) {
//       throw new Error("Auction not found");
//     }

//     return auction[0]; // Return the first (and only) auction object
//   } catch (error) {
//     console.error("Error fetching auction:", error);
//     throw error;
//   }
// };
// const getAllAuctionFromDB = async (query, userId, bidHistoryLimit = 5) => {
//   try {
//     // Query auctions based on filters, search, pagination, and sorting
//     const auctionQuery = new QueryBuilder(Auction.find(), query)
//       .search(["name"])
//       .filter()
//       .sort()
//       .paginate()
//       .fields();

//     // Execute the query and populate related user data
//     const auctions = await auctionQuery.modelQuery
//       .populate({
//         path: "bidBuddyUsers.user",
//         select: "name email profile_image",
//       })
//       .populate({
//         path: "bidHistory.user",
//         select: "name email profile_image location",
//       })
//       .exec();

//     if (!auctions || auctions.length === 0) {
//       throw new Error("No auctions found");
//     }

//     // Retrieve bookmarks for the user
//     const bookmarks = await Bookmark.find({ user: userId }).select("auction");
//     const bookmarkedAuctionIds = new Set(
//       bookmarks.map((b) => b.auction.toString())
//     );

//     // Process the auctions data to match the required structure
//     const enrichedAuctions = auctions.map((auction) => {
//       const bidBuddyUsers = auction.bidBuddyUsers.map((bidBuddy) => ({
//         user: bidBuddy.user._id,
//         availableBids: bidBuddy.availableBids,
//         isActive: bidBuddy.isActive,
//         name: bidBuddy.user.name,
//         email: bidBuddy.user.email,
//         profile_image: bidBuddy.user.profile_image,
//       }));

//       const bidHistory = auction.bidHistory
//         .slice(-bidHistoryLimit) // Limit the bid history
//         .map((bid) => ({
//           user: bid.user._id,
//           bidAmount: bid.bidAmount,
//           time: bid.time,
//           name: bid.user.name,
//           email: bid.user.email,
//           profile_image: bid.user.profile_image,
//           location: bid.user.location,
//         }));

//       return {
//         ...auction.toObject(),
//         bidBuddyUsers,
//         bidHistory,
//         isBookmark: bookmarkedAuctionIds.has(auction._id.toString()),
//       };
//     });

//     // Get total count for pagination meta data
//     const meta = await auctionQuery.countTotal();

//     return { meta, result: enrichedAuctions };
//   } catch (error) {
//     console.error("Error fetching auctions:", error);
//     throw error;
//   }
// };

const getSingleAuctionFromDB = async (auctionId, bidHistoryLimit = 5) => {
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

    return auction[0]; // Return the first (and only) auction object
  } catch (error) {
    console.error("Error fetching auction:", error);
    throw error;
  }
};

// const getSingleAuctionFromDB = async (id) => {
//   // Fetch the auction by ID and populate the bidBuddyUsers field with a limit of 10
//   const result = await Auction.findById(id).populate({
//     path: "bidBuddyUsers.userId",
//     options: { limit: 10 },
//   });

//   // Check if the result is null or undefined
//   if (!result) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
//   }

//   return result;
// };

// update auction into db
const updateAuctionIntoDB = async (id, data) => {
  const auction = await Auction.findById(id).select("status currentPrice");
  if (!auction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
  }

  if (
    result.status === ENUM_AUCTION_STATUS.COMPLETED &&
    result.currentPrice > 0
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This auction already completed , a user won this auction you can not update this auction right now "
    );
  }
  const startingDate = new Date(data.startingDate);
  const [hours, minutes] = data.startingTime.split(":");

  startingDate.setHours(hours, minutes);

  data.activateTime = startingDate;
  if (startingDate <= new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please add future date");
  }
  const result = await Auction.findByIdAndUpdate(id, data, {
    runValidators: true,
    new: true,
  });

  return result;
};

// delete auction from db
const deleteAuctionFromDB = async (id) => {
  const auction = await Auction.findById(id);
  if (!auction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
  }
  if (auction.status === ENUM_AUCTION_STATUS.ACTIVE) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You can not delete auction when the auction is active"
    );
  }
  if (auction.status === ENUM_AUCTION_STATUS.COMPLETED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You can not delete auction when the auction is completed"
    );
  }
  const result = await Auction.findByIdAndDelete(id);
  return result;
};

const getMyBiddingHistoryFromDB = async (userId) => {
  const auctions = await Auction.find({ status: ENUM_AUCTION_STATUS.COMPLETED })
    // .select(
    //   "name category reservedBid status images bidBuddyUsers currentPrice bidPlace bidHistory winingBidder status"
    // )
    .populate("winingBidder.user", "name")
    .populate({
      path: "bidBuddyUsers.user",
      select: "name",
    })
    .populate({ path: "bidHistory.user" });

  const result = auctions.map((auction) => {
    console.log("bid history", auction?.bidHistory?.slice(0, 2));
    const userBidHistory = auction.bidHistory.filter(
      (bid) => bid?.user?._id === userId
    );

    const finalBid = userBidHistory.length
      ? userBidHistory[userBidHistory.length - 1].bidAmount
      : null;

    const isWinner =
      auction.winingBidder &&
      auction.winingBidder.user._id.toString() === userId.toString();

    return {
      name: auction.name,
      category: auction.category,
      status: isWinner ? "Winner" : "Outbid",
      image: auction.images[0],
      currentPrice: auction.currentPrice,
      finalBid: finalBid,
      bidPlace: auction.bidPlace,
      winningBidderName: auction.winingBidder
        ? auction.winingBidder.user.name
        : null,
    };
  });

  return result;
};

// // Schedule to run the update function every second
let isRunning = false;

const updateAuctionStatuses = async () => {
  if (isRunning) return;

  isRunning = true;
  const currentTime = new Date();
  const nineSecondsAgo = new Date(currentTime.getTime() - 9 * 1000);
  const fiveSecondAgo = new Date(currentTime.getTime() - 5 * 1000);

  try {
    const auctionsToActivate = await Auction.updateMany(
      {
        activateTime: { $lte: nineSecondsAgo },
        status: ENUM_AUCTION_STATUS.UPCOMING,
      },
      {
        $set: { status: ENUM_AUCTION_STATUS.ACTIVE },
      }
    );
    console.log(`Activated ${auctionsToActivate.modifiedCount} auctions.`);

    const activatedAuctions = await Auction.find({
      status: ENUM_AUCTION_STATUS.ACTIVE,
    });

    activatedAuctions.forEach((auction) => {
      global.io.sockets.sockets.forEach((socket) => {
        socket.join(auction._id.toString());
      });
    });

    // const allAuctions = await Auction.find();
    // global.io.emit("allAuctions", allAuctions);

    // get auctions those are ready for bid with bidBuddy----------------------------
    const readyAuctionsForBidBuddyBid = await Auction.find({
      activateTime: { $lte: fiveSecondAgo },
      status: ENUM_AUCTION_STATUS.ACTIVE,
    });

    readyAuctionsForBidBuddyBid?.forEach((auction) => {
      console.log("Nice to meet yo9u in random bit");
      placeRandomBid(auction?._id);
    });
    //-----------------------------------------------
    // for complete auction
    // const auctionsToComplete = await Auction.find(
    //   {
    //     activateTime: { $lte: currentTime },
    //     status: ENUM_AUCTION_STATUS.ACTIVE,
    //   },
    //   { _id: 1 }
    // );

    // const auctionIds = auctionsToComplete.map((auction) => auction._id);

    // await Auction.updateMany(
    //   {
    //     _id: { $in: auctionIds },
    //   },
    //   {
    //     $set: { status: ENUM_AUCTION_STATUS.COMPLETED },
    //   }
    // );

    // Mark auctions as completed if activateTime is less than or equal to the current time---------------
    const auctionsToComplete = await Auction.updateMany(
      {
        activateTime: { $lte: currentTime },
        status: ENUM_AUCTION_STATUS.ACTIVE,
      },
      {
        $set: { status: ENUM_AUCTION_STATUS.COMPLETED },
      }
    );
    console.log(`Completed ${auctionsToComplete.modifiedCount} auctions.`);
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    // Find and broadcast the completed auctions
    if (auctionsToComplete.modifiedCount > 0) {
      const completedAuctions = await Auction.find({
        status: ENUM_AUCTION_STATUS.COMPLETED,
        updatedAt: { $gte: oneMinuteAgo },
      });

      completedAuctions.forEach((completedAuction) => {
        global.io.sockets.sockets.forEach((socket) => {
          socket.broadcast.emit("updated-auction", {
            updatedAuction: completedAuction,
          });
          console.log("completed id", completedAuction?._id);
          global.io
            .to(completedAuction?._id)
            .emit("bidHistory", { updatedAuction: completedAuction });
        });
      });
    }
    //-----------------------------------------
  } catch (error) {
    console.error("Error updating auctions:", error);
  } finally {
    isRunning = false;
  }
};

// Schedule to run the update function every second
setInterval(updateAuctionStatuses, 1000);

// Cron job to run every 5 minutes for notify by email -----------------------
cron.schedule("*/5 * * * *", async () => {
  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60 * 1000);

    const auctions = await Auction.find({
      activateTime: { $gte: twentyMinutesFromNow, $lte: thirtyMinutesFromNow },
    });

    if (auctions.length === 0) return;

    for (const auction of auctions) {
      const bookmarks = await Bookmark.find({ auction: auction._id }).populate({
        path: "user",
        select: "email",
      });

      console.log("bookmark user email from crone", bookmarks);
      const html = getAuctionEmailTemplate(auction);
      const subject = `Reminder: Auction "${auction.name}" Starts Soon!`;

      for (const bookmark of bookmarks) {
        const email = bookmark.user.email;
        const options = { email, subject, html };
        sendEmail(options);
      }
    }
  } catch (error) {
    console.error("Error in auction reminder job:", error);
  }
});

const auctionService = {
  createAuctionIntoDB,
  getAllAuctionFromDB,
  updateAuctionIntoDB,
  deleteAuctionFromDB,
  getSingleAuctionFromDB,
  getMyBiddingHistoryFromDB,
};

module.exports = auctionService;
