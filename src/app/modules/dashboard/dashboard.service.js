const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const QueryBuilder = require("../../../builder/QueryBuilder");
const Banner = require("./banner.model");
const {
  sendImageToCloudinary,
} = require("../../../helpers/sendImageToCloudinary");

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

// --- banner ---

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

// // --- driver ---

// const getAllDriver = async (query) => {
//   const driversQuery = new QueryBuilder(Driver.find(), query)
//     .search(["name"])
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const result = await driversQuery.modelQuery;
//   const meta = await driversQuery.countTotal();

//   if (!result) {
//     throw new ApiError(httpStatus.NOT_FOUND, "No drivers found");
//   }

//   return { result, meta };
// };

// const getSingleDriver = async (payload) => {
//   const { email } = payload;
//   const driver = await Driver.findOne({ email: email });

//   if (!driver) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   return driver;
// };

// const blockUnblockDriver = async (payload) => {
//   const { email, is_block } = payload;
//   const existingDriver = await Driver.findOne({ email: email });

//   if (!existingDriver) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Driver not found");
//   }

//   return await Driver.findOneAndUpdate(
//     { email: email },
//     { $set: { is_block } },
//     {
//       new: true,
//       runValidators: true,
//     }
//   );
// };

// const verifyDriver = async (payload) => {
//   const { email, isVerified } = payload;
//   const existingDriver = await Driver.findOne({ email: email });

//   if (!existingDriver) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Driver not found");
//   }

//   return await Driver.findOneAndUpdate(
//     { email: email },
//     { $set: { isVerified } },
//     {
//       new: true,
//       runValidators: true,
//     }
//   );
// };

// -------------------

// const createUser = async (userData) => {
//   const newUser = await User.create(userData);
//   return newUser;
// };

// const getAllAdmin = async () => {
//   const results = await Admin.find({}).lean();
//   return results;
// };

const DashboardServices = {
  getAllUsers,
  getSingleUser,
  blockUnblockUser,
  addBanner,
  updateBannerIndex,
  deleteBanner,
  // getAllDriver,
  // getSingleDriver,
  // blockUnblockDriver,
  // verifyDriver,
};

module.exports = DashboardServices;
