const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const QueryBuilder = require("../../../builder/QueryBuilder");
const { Transaction } = require("../payment/payment.model");
const { ENUM_PAYMENT_STATUS } = require("../../../utils/enums");
const Auction = require("../auction/auction.model");

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
  getDashboardMetaDataFromDB,
  // getAllDriver,
  // getSingleDriver,
  // blockUnblockDriver,
  // verifyDriver,
};

module.exports = DashboardServices;
