const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const {
  sendImageToCloudinary,
} = require("../../../helpers/sendImageToCloudinary");
const Auction = require("./auction.model");
const QueryBuilder = require("../../../builder/QueryBuilder");
const createNotification = require("../../../helpers/createNotification");
const getUnseenNotificationCount = require("../../../helpers/getUnseenNotificationCount");

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
const createAuctionIntoDB = async (images, data) => {
  // Start a new session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let imageUrls = [];

    if (images) {
      for (const image of images) {
        const imageName = image?.filename;
        const { secure_url } = await sendImageToCloudinary(
          imageName,
          image?.path
        );
        imageUrls.push(secure_url);
      }
    }

    data.images = imageUrls;

    const result = await Auction.create([data], { session });
    if (!result || result.length === 0) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Auction not created, try again"
      );
    }

    // Format the starting date and time
    const startingDate = new Date(data.startingDate);
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
    const formattedTime = startingDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const notificationMessage = `Vintage Car Collection has been successfully created and scheduled to start on ${formattedDate} at ${formattedTime}.`;

    await createNotification(notificationMessage, session);

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

    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Something went wrong. Try again later."
    );
  }
};

const getAllAuctionFromDB = async (query) => {
  const auctionQuery = new QueryBuilder(Auction.find(), query)
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await auctionQuery.modelQuery;
  const meta = await auctionQuery.countTotal();
  return { meta, result };
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
  const auction = await Auction.findById(id);
  if (!auction) {
    throw new ApiError(httpStatus.NOT_FOUND, "Auction not found");
  }
  let imageUrls = [...data?.images];
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

const auctionService = {
  createAuctionIntoDB,
  getAllAuctionFromDB,
  updateAuctionIntoDB,
  deleteAuctionFromDB,
  getSingleAuctionFromDB,
  getMyBiddingHistoryFromDB,
};

module.exports = auctionService;
