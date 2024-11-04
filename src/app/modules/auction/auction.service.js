const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const Auction = require("./auction.model");
const fs = require("fs");
const path = require("path");
const { default: mongoose } = require("mongoose");
const { ENUM_AUCTION_STATUS, ENUM_USER_ROLE } = require("../../../utils/enums");
const Bookmark = require("../bookmark/bookmark.model");
const Notification = require("../notification/notification.model");
const cron = require("node-cron");
const getAuctionEmailTemplate = require("../../../helpers/getAuctionEmailTemplate");
const { sendEmail } = require("../../../utils/sendEmail");
const getAdminNotificationCount = require("../../../helpers/getAdminNotificationCount");
const placeRandomBid = require("../../../socket/bidding/placeRandomBid");
const QueryBuilder = require("../../../builder/queryBuilder");
const User = require("../user/user.model");
const getUpdatedAuction = require("../../../helpers/getUpdatedAuctiion");
const getUniqueUsersFromBidHistory = require("../../../helpers/getUniqueUsersFromBidHistory");
const config = require("../../../config");
// const createAuctionIntoDB = async (data) => {
//   const startingDate = new Date(data.startingDate);
//   const [hours, minutes] = data.startingTime.split(":");

//   startingDate.setHours(hours, minutes);

//   data.activateDateTime = startingDate;

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Format the starting date and time
//     data.activateTime = startingDate;
//     if (startingDate <= new Date()) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "Please add future date");
//     }

//     const result = await Auction.create([data], { session });
//     if (!result || result.length === 0) {
//       throw new ApiError(
//         httpStatus.INTERNAL_SERVER_ERROR,
//         "Auction not created, try again"
//       );
//     }

//     const [hours, minutes] = data.startingTime.split(":");
//     startingDate.setHours(hours, minutes);

//     // Format the date and time to a readable format
//     const options = {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       hour: "numeric",
//       minute: "numeric",
//       hour12: true,
//     };
//     const formattedDate = startingDate.toLocaleDateString("en-US", options);
//     const notificationMessage = `${data?.name} has been successfully created and scheduled to start on ${formattedDate}.`;
//     await Notification.create({
//       message: notificationMessage,
//       receiver: ENUM_USER_ROLE.ADMIN,
//     });

//     // send notifications to the admin
//     const adminUnseenNotificationCount = await getAdminNotificationCount();
//     global.io.emit("admin-notifications", adminUnseenNotificationCount);

//     await session.commitTransaction();
//     session.endSession();

//     return result;
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();

//     if (err instanceof ApiError) {
//       throw err;
//     }
//     if (err instanceof mongoose.Error.ValidationError) {
//       const messages = Object.values(err.errors).map((error) => error.message);
//       throw new ApiError(httpStatus.BAD_REQUEST, messages.join(", "));
//     }

//     throw new ApiError(
//       httpStatus.SERVICE_UNAVAILABLE,
//       "Something went wrong. Try again later."
//     );
//   }
// };
const createAuctionIntoDB = async (data) => {
  const endingDate = new Date(data.endingDate);
  const [hours, minutes] = data.endingTime.split(":");
  const startingDate = new Date(data.startingDate);
  const [startHours, startMinutes] = data.startingTime.split(":");
  startingDate.setHours(startHours, startMinutes);
  data.startingDateTime = startingDate;

  endingDate.setHours(hours, minutes);
  data.activateDateTime = endingDate;

  try {
    // Check if starting date is in the future
    data.activateTime = endingDate;
    if (endingDate <= new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Please add future date");
    }
    if(startingDate <= new Date()){
      throw new ApiError(httpStatus.BAD_REQUEST, "Please add future date");
    }

    // Create auction in the database
    const result = await Auction.create(data);
    if (!result) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Auction not created, try again"
      );
    }

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

    // Create a notification for the admin
    await Notification.create({
      message: notificationMessage,
      receiver: ENUM_USER_ROLE.ADMIN,
    });

    // Send notifications to the admin
    const adminUnseenNotificationCount = await getAdminNotificationCount();
    global.io.emit("admin-notifications", adminUnseenNotificationCount);

    return result;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof mongoose.Error.ValidationError) {
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
          endingDate: 1,
          endingTime: 1,
          description: 1,
          images: 1,
          status: 1,
          currentPrice: 1,
          totalBidPlace: 1,
          countdownTime: 1,
          activateTime: 1,
          startingDateTime: 1,
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

// update auction into db
const updateAuctionIntoDB = async (id, data) => {
  const auction = await Auction.findById(id).select("status currentPrice");
  if (!auction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
  }

  if (
    auction.status === ENUM_AUCTION_STATUS.COMPLETED &&
    auction.currentPrice > 0
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This auction already completed , a user won this auction you can not update this auction right now "
    );
  }
  const endingDate = new Date(data.endingDate);
  const [hours, minutes] = data.endingTime.split(":");
  const startingDate = new Date(data.startingDate);
  const [startHours, startMinutes] = data.startingTime.split(":");
  startingDate.setHours(startHours, startMinutes);
  data.startingDateTime = startingDate;

  endingDate.setHours(hours, minutes);

  data.activateTime = endingDate;
  if (endingDate <= new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please add future date");
  }

  if (endingDate > new Date()) {
    data.status = ENUM_AUCTION_STATUS.UPCOMING;
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

// Extract local paths from URLs
// const baseUrl = "http://192.168.10.11:6050/";
if (auction.images && Array.isArray(auction.images)) {
  auction.images.forEach((imageUrl) => {
    // Replace the base URL with an empty string and normalize the path
    const relativePath = imageUrl.replace(config.image_url, "").replace(/\\/g, "/");
    const filePath = path.join(__dirname, "../../../../", relativePath); // Adjusted to point to the root

    console.log(filePath);

    // Check if the file exists and delete it
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

  const result = await Auction.findByIdAndDelete(id);
  return result;
};

// get my bidding history----------------
const getMyBiddingHistoryFromDB = async (userId) => {
  const auctions = await Auction.find({
    status: ENUM_AUCTION_STATUS.COMPLETED,
    "bidHistory.user": userId,
  })
    .populate("winingBidder.user", "name")
    .populate({
      path: "bidBuddyUsers.user",
      select: "name",
    })
    .populate({ path: "bidHistory.user" });

  const result = await Promise.all(
    auctions.map(async (auction) => {
      const uniqueBidHistory = await getUniqueUsersFromBidHistory(auction._id);
      const userBidHistory = uniqueBidHistory.filter(
        (bid) => bid?.userId.toString() === userId
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
        bidPlace: auction.totalBidPlace,
        winningBidderName: auction.winingBidder
          ? auction.winingBidder.user.name
          : null,
      };
    })
  );

  return result;
};

// // Schedule to run the update function every second
let isRunning = false;

const updateAuctionStatuses = async () => {
  if (isRunning) return;

  isRunning = true;
  const currentTime = new Date();
  const fiveSecondLetter = new Date(currentTime.getTime() + 5 * 1000);
  const nineSecondsLater = new Date(currentTime.getTime() + 9 * 1000);
  try {
    const auctionsToActivate = await Auction.updateMany(
      {
        // activateTime: { $gte: currentTime, $lte: nineSecondsLater },
        startingDateTime: { $lte: currentTime },
        status: ENUM_AUCTION_STATUS.UPCOMING,
      },
      {
        $set: { status: ENUM_AUCTION_STATUS.ACTIVE },
        countdownTime: 9,
      }
    );
    console.log(`Activated ${auctionsToActivate.modifiedCount} auctionss.`);

    const activatedAuctions = await Auction.find({
      status: ENUM_AUCTION_STATUS.ACTIVE,
    });
    const activatedAuctions2 = await Auction.find({
      startingDateTime: {
        $gte: new Date(Date.now() - 500),
        $lt: new Date(Date.now()),
      },
    });

    activatedAuctions.forEach((auction) => {
      global.io.sockets.sockets.forEach((socket) => {
        socket.join(auction._id.toString());
      });
    });
    activatedAuctions2.forEach(async (auction) => {
      const updatedActiveAuction = await getUpdatedAuction(auction?._id);
      global.io.sockets.sockets.forEach((socket) => {
        socket.broadcast.emit("updated-auction", {
          updatedAuction: updatedActiveAuction,
        });
        global.io
          .to(auction?._id.toString())
          .emit("bidHistory", { updatedAuction: updatedActiveAuction });
      });
    });

    const allAuctions = await Auction.find();
    global.io?.emit("allAuctions", allAuctions);
    // global.io.emit("bidHistory", allAuctions);

    // get auctions those are ready for bid with bidBuddy----------------------------
    const readyAuctionsForBidBuddyBid = await Auction.find({
      activateTime: { $gte: currentTime, $lte: fiveSecondLetter },
      status: ENUM_AUCTION_STATUS.ACTIVE,
    });

    readyAuctionsForBidBuddyBid?.forEach((auction) => {
      console.log("Nice to meet you in random bit");
      placeRandomBid(auction?._id);
    });

    // Mark auctions as completed if activateTime is less than or equal to the current time---------------
    const auctionsToComplete = await Auction.updateMany(
      {
        activateTime: { $lte: currentTime },
        status: ENUM_AUCTION_STATUS.ACTIVE,
      },
      {
        $set: { status: ENUM_AUCTION_STATUS.COMPLETED },
        countdownTime: 0,
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

      completedAuctions.forEach(async (completedAuction) => {
        const updatedCompletedAuction = await getUpdatedAuction(
          completedAuction?._id
        );

        global.io.sockets.sockets.forEach((socket) => {
          socket.broadcast.emit("updated-auction", {
            updatedAuction: updatedCompletedAuction,
          });
          global.io
            .to(completedAuction?._id.toString())
            .emit("bidHistory", { updatedAuction: updatedCompletedAuction });
        });
        // return back bids to the winner if he set bidBuddy
        const winningBidderId = completedAuction?.winingBidder?.user;

        if (winningBidderId) {
          await User.findByIdAndUpdate(winningBidderId, {
            $inc: { totalWin: 1 },
          });

          // Find the bidBuddyUser matching the winning bidder
          const winningBidderBuddy = completedAuction.bidBuddyUsers.find(
            (buddy) => String(buddy.user) === String(winningBidderId)
          );

          if (winningBidderBuddy) {
            const remainingBids = winningBidderBuddy.availableBids;
            await User.findByIdAndUpdate(winningBidderId, {
              $inc: { availableBid: remainingBids },
            });

            console.log(
              `Added ${remainingBids} bids to user ${winningBidderId}`
            );
          } else {
            console.log("Winning bidder not found in bidBuddyUsers");
          }
        } else {
          console.log("No winning bidder for auction", completedAuction._id);
        }
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
