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

// const createAuctionIntoDB = async (images, data) => {
//   console.log("images", images);
//   console.log("data", data);
//   let imageUrls = [];
//   if (images) {
//     for (const image of images) {
//       const imageName = image?.filename;
//       const { secure_url } = await sendImageToCloudinary(
//         imageName,
//         image?.path
//       );
//       imageUrls.push(secure_url);
//     }
//   }
//   data.images = imageUrls;
//   const result = await Auction.create(data);
//   if (result) {
//     const startingDate = new Date(data.startingDate);
//     const [hours, minutes] = data.startingTime.split(":");

//     // Set the time
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
//     const formattedTime = startingDate.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "numeric",
//       hour12: true,
//     });

//     const notificationMessage = `Vintage Car Collection has been successfully created and scheduled to start on ${formattedDate} at ${formattedTime}.`;
//     const createNotificationIntoDB = await createNotification(
//       notificationMessage
//     );
//     const unseenNotificationCount = await getUnseenNotificationCount();
//     global.io.emit("notifications", unseenNotificationCount);
//   } else {
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       "Auction not created , try again"
//     );
//   }
//   return result;
// };

// get all auction
// const createAuctionIntoDB = async (images, data) => {
//   console.log("data", data);
//   // Start a new session for the transaction
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     let imageUrls = [];

//     if (images) {
//       for (const image of images) {
//         const imageName = image?.filename.slice(0, -4);
//         const { secure_url } = await sendImageToCloudinary(
//           imageName,
//           image?.path
//         );
//         imageUrls.push(secure_url);
//       }
//     }

//     data.images = imageUrls;
//     // Format the starting date and time
//     const startingDate = new Date(data.startingDate);
//     data.activateTime = startingDate;
//     console.log("starting date", startingDate);
//     // if (startingDate <= new Date()) {
//     //   throw new ApiError(httpStatus.BAD_REQUEST, "Please add future date");
//     // }
//     // Check if the starting date-time is in the past

//     const currentDate = new Date(); // Current date and time

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
//     console.log("formated data", formattedDate);
//     // const formattedTime = startingDate.toLocaleTimeString("en-US", {
//     //   hour: "numeric",
//     //   minute: "numeric",
//     //   hour12: true,
//     // });

//     const notificationMessage = `${data?.name} has been successfully created and scheduled to start on ${formattedDate}.`;

//     await createNotification(notificationMessage, session);

//     const unseenNotificationCount = await getUnseenNotificationCount();
//     global.io.emit("notifications", unseenNotificationCount);

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
//       // Handle Mongoose validation error
//       const messages = Object.values(err.errors).map((error) => error.message);
//       throw new ApiError(httpStatus.BAD_REQUEST, messages.join(", "));
//     }

//     throw new ApiError(
//       httpStatus.SERVICE_UNAVAILABLE,
//       "Something went wrong. Try again later."
//     );
//   }
// };

const createAuctionIntoDB = async (images, data) => {
  const startingDate = new Date(data.startingDate);
  const [hours, minutes] = data.startingTime.split(":");

  startingDate.setHours(hours, minutes);

  data.activateDateTime = startingDate;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let imageUrls = [];

    if (images) {
      for (const image of images) {
        const imageName = image?.filename.slice(0, -4);
        const { secure_url } = await sendImageToCloudinary(
          imageName,
          image?.path
        );
        imageUrls.push(secure_url);
      }
    }

    data.images = imageUrls;
    // Format the starting date and time
    data.activateTime = startingDate;
    console.log("starting date", startingDate);
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
    await createNotification(
      { notificationMessage, receiver: ENUM_USER_ROLE.ADMIN },
      session
    );

    const unseenNotificationCount = await getUnseenNotificationCount();
    global.io.emit("notifications", unseenNotificationCount);

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
  console.log(userId);
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
const getSingleAuctionFromDB = async (id) => {
  const result = await Auction.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
  }
  return result;
};

// update auction into db
const updateAuctionIntoDB = async (id, newImages, data) => {
  const startingDate = new Date(data.startingDate);
  const [hours, minutes] = data.startingTime.split(":");

  startingDate.setHours(hours, minutes);

  const auction = await Auction.findById(id);
  if (!auction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
  }
  let imageUrls = [...data?.images];
  data.activateTime = startingDate;
  if (startingDate <= new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please add future date");
  }
  if (newImages) {
    for (const image of newImages) {
      const imageName = image?.filename;
      const { secure_url } = await sendImageToCloudinary(
        imageName,
        image?.path
      );
      imageUrls.push(secure_url);
    }
  }

  data.images = imageUrls;
  const result = await Auction.findByIdAndUpdate(id, data, {
    runValidators: true,
    new: true,
  });
  return result;
};

// delete auction from db
const deleteAuctionFromDB = async (id) => {
  const result = await Auction.findByIdAndDelete(id);
  return result;
};

// get my bidding history
const getMyBiddingHistoryFromDB = async (userId) => {
  const result = await Auction.find({
    bidBuddyUsers: {
      $elemMatch: { user: userId },
    },
  }).select("name category reservedBid status images currentPrice");

  return result;
};

let isRunning = false; // Initialize the lock

// const updateAuctionStatuses = async () => {
//   if (isRunning) return; // If the function is already running, exit

//   isRunning = true; // Set the lock to true, indicating the function is running
//   const currentTime = new Date();

//   try {
//     // Perform your auction update logic here
//     const auctionsToActivate = await Auction.updateMany(
//       {
//         activateTime: { $lte: currentTime },
//         status: ENUM_AUCTION_STATUS.UPCOMING,
//       },
//       { $set: { status: ENUM_AUCTION_STATUS.ACTIVE } }
//     );

//     console.log(`Activated ${auctionsToActivate.modifiedCount} auctions.`);
//   } catch (error) {
//     console.error("Error updating auctions:", error);
//   } finally {
//     isRunning = false; // Release the lock after execution
//   }
// };
// const updateAuctionStatuses = async () => {
//   if (isRunning) return; // If the function is already running, exit

//   isRunning = true; // Set the lock to true, indicating the function is running
//   const currentTime = new Date();

//   try {
//     // Perform your auction update logic here
//     const auctionsToActivate = await Auction.updateMany(
//       {
//         startingDate: { $lte: currentTime },
//         status: ENUM_AUCTION_STATUS.UPCOMING,
//       },
//       {
//         $set: { status: ENUM_AUCTION_STATUS.ACTIVE, countdownTime: 9 },
//       }
//     );

//     console.log(`Activated ${auctionsToActivate.modifiedCount} auctions.`);

//     const allAuctions = await Auction.find();

//     global.io.emit("allAuctions", allAuctions);

//     // Start countdown for active auctions
//     if (auctionsToActivate.modifiedCount > 0) {
//       const activatedAuctions = await Auction.find({
//         status: ENUM_AUCTION_STATUS.ACTIVE,
//         countdownTime: 9,
//       });

//       activatedAuctions.forEach((auction) => {
//         handleCountdown(auction._id);
//       });
//     }
//   } catch (error) {
//     console.error("Error updating auctions:", error);
//   } finally {
//     isRunning = false;
//   }
// };

// // Schedule to run the update function every second
// setInterval(updateAuctionStatuses, 1000);

const auctionService = {
  createAuctionIntoDB,
  getAllAuctionFromDB,
  updateAuctionIntoDB,
  deleteAuctionFromDB,
  getSingleAuctionFromDB,
  getMyBiddingHistoryFromDB,
};

module.exports = auctionService;
