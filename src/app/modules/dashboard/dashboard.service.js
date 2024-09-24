const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const QueryBuilder = require("../../../builder/QueryBuilder");
const { Transaction } = require("../payment/payment.model");
const { ENUM_PAYMENT_STATUS } = require("../../../utils/enums");
const Auction = require("../auction/auction.model");
const Banner = require("./banner.model");

// --- user ---

const getAllUsers = async (query) => {
  const usersQuery = new QueryBuilder(User.find(), query)
    .search(["name"])
    .filter()
    .sort()
    .paginate()
    .fields();
  const result = await usersQuery.modelQuery;
  const meta = await usersQuery.countTotal();

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "No users found");
  }
  return { meta, result };
};

const getSingleUser = async (payload) => {
  const { email } = payload;

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing request body");
  }

  const user = await User.findOne({ email: email });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const blockUnblockUser = async (payload) => {
  const { email, is_block } = payload;

  if (!email || !payload.hasOwnProperty("is_block")) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing request body");
  }

  const existingUser = await User.findOne({ email: email });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return await User.findOneAndUpdate(
    { email: email },
    { $set: { is_block } },
    {
      new: true,
      runValidators: true,
    }
  );
};

const getDashboardMetaDataFromDB = async () => {
  const income = await Transaction.aggregate([
    {
      $match: { paymentStatus: ENUM_PAYMENT_STATUS.PAID },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$paidAmount" },
      },
    },
  ]);
  const totalIncome = income?.length > 0 ? income[0].totalIncome : 0;

  const totalUser = await User.countDocuments();
  const totalAuction = await Auction.countDocuments();

  const topBidders = await User.find()
    .sort({ totalWin: -1 })
    .limit(4)
    .select("name profile_image totalWin");
  const topAuctions = await Auction.find()
    .sort({ currentPrice: -1 })
    .limit(4)
    .select("name images currentPrice");

  return {
    totalIncome,
    totalUser,
    totalAuction,
    topBidders,
    topAuctions,
  };
};

const addBanner = async (req) => {
  const { files, body } = req || {};

  if (!files.banner?.length || Object.keys(body).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image or body is not provided");
  }

  const existingIndex = await Banner.findOne({ index: body.index });
  if (existingIndex) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Index already exists. Please choose a different index."
    );
  }

  const { banner } = files;
  const { originalname, path } = banner[0];

  const { secure_url: url } =
    (await sendImageToCloudinary(originalname, path)) || {};

  if (!url) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Image upload failed");
  }

  const existingUrl = await Banner.findOne({ url });

  if (existingUrl) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "You have already uploaded the image"
    );
  }

  const newBanner = {
    url,
    ...body,
  };

  return await Banner.create(newBanner);
};

const updateBannerIndex = async (payload) => {
  const { newIndex, id } = payload;

  const bannerToUpdate = await Banner.findById(id);

  if (!bannerToUpdate) {
    throw new ApiError(httpStatus.NOT_FOUND, "Banner not found");
  }

  const oldIndex = bannerToUpdate.index;

  if (newIndex > oldIndex) {
    // Decrease the index of all pictures that are between oldIndex+1 and newIndex
    await Banner.updateMany(
      { index: { $gt: oldIndex, $lte: newIndex } },
      { $inc: { index: -1 } }
    );
  } else if (newIndex < oldIndex) {
    // Increase the index of all pictures that are between newIndex and oldIndex-1
    await Banner.updateMany(
      { index: { $gte: newIndex, $lt: oldIndex } },
      { $inc: { index: 1 } }
    );
  }

  bannerToUpdate.index = newIndex;
  return await bannerToUpdate.save();
};

const deleteBanner = async (payload) => {
  const { id } = payload;
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No id provided");
  }

  const banner = await Banner.findById(id);
  if (!banner) {
    throw new ApiError(httpStatus.NOT_FOUND, "Banner does not exist");
  }

  return await Banner.findByIdAndDelete(id);
};

const DashboardServices = {
  getAllUsers,
  getSingleUser,
  blockUnblockUser,
  getDashboardMetaDataFromDB,
  addBanner,
  updateBannerIndex,
  deleteBanner,
  // getAllDriver,
  // getSingleDriver,
  // blockUnblockDriver,
  // verifyDriver,
};

module.exports = DashboardServices;
