const httpStatus = require("http-status");
const ApiError = require("../../../errors/ApiError");
const User = require("../user/user.model");
const { Transaction } = require("../payment/payment.model");
const { ENUM_PAYMENT_STATUS } = require("../../../utils/enums");
const Auction = require("../auction/auction.model");
const Banner = require("./banner.model");
const config = require("../../../config");
const QueryBuilder = require("../../../builder/queryBuilder");

const getAllUsers = async (query) => {
  const usersQuery = new QueryBuilder(User.find(), query)
    .search(["name", "email"])
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

// const getAreaChartDataForIncomeFromDB = async (year) => {
//   // Create date objects for the start and end of the year
//   const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
//   const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

//   const incomeData = await Transaction.aggregate([
//     {
//       $match: {
//         createdAt: {
//           $gte: startDate,
//           $lt: endDate,
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { $month: "$createdAt" }, // Group by month
//         totalIncome: { $sum: "$paidAmount" }, // Sum the paid amounts
//       },
//     },
//     {
//       $sort: { _id: 1 }, // Sort by month
//     },
//   ]);

//   console.log("Aggregated Income Data:", incomeData); // Log the aggregated data

//   // Create an array for all months with default income of 0
//   const months = Array.from({ length: 12 }, (_, i) => ({
//     month: new Date(0, i).toLocaleString("default", { month: "short" }), // Month names
//     totalIncome: 0,
//   }));

//   // Map the aggregated data to the corresponding months
//   incomeData.forEach((data) => {
//     const monthIndex = data._id - 1; // Convert month (1-12) to index (0-11)
//     if (months[monthIndex]) {
//       months[monthIndex].totalIncome = data.totalIncome;
//     }
//   });

//   // Calculate Yearly Growth
//   const previousYearIncomeData = await Transaction.aggregate([
//     {
//       $match: {
//         createdAt: {
//           $gte: new Date(`${year - 1}-01-01T00:00:00.000Z`),
//           $lt: new Date(`${year}-01-01T00:00:00.000Z`),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         totalIncome: { $sum: "$paidAmount" },
//       },
//     },
//   ]);

//   const currentYearTotalIncome = months.reduce(
//     (acc, month) => acc + month.totalIncome,
//     0
//   );
//   const previousYearTotalIncome = previousYearIncomeData[0]
//     ? previousYearIncomeData[0].totalIncome
//     : 0;

//   const yearlyGrowth =
//     previousYearTotalIncome > 0
//       ? ((currentYearTotalIncome - previousYearTotalIncome) /
//           previousYearTotalIncome) *
//         100
//       : currentYearTotalIncome > 0
//       ? currentYearTotalIncome // If previous year was 0 and current year is > 0
//       : 0;

//   // Calculate Monthly Growth Percentages
//   const currentMonthIndex = new Date().getMonth(); // Current month index (0-11)
//   const previousMonthIndex =
//     currentMonthIndex === 0 ? 11 : currentMonthIndex - 1; // Previous month index
//   const previousMonthIncome = months[previousMonthIndex].totalIncome;

//   const monthlyGrowth =
//     previousMonthIncome > 0
//       ? ((months[currentMonthIndex].totalIncome - previousMonthIncome) /
//           previousMonthIncome) *
//         100
//       : months[currentMonthIndex].totalIncome > 0
//       ? months[currentMonthIndex].totalIncome // If previous month was 0 and current month is > 0
//       : 0;

//   // Calculate Daily Growth
//   const today = new Date();
//   const todayStart = new Date(today.setHours(0, 0, 0, 0));
//   const yesterdayStart = new Date(today.setDate(today.getDate() - 1));

//   const dailyIncomeData = await Transaction.aggregate([
//     {
//       $match: {
//         createdAt: {
//           $gte: yesterdayStart,
//           $lt: new Date(yesterdayStart.setHours(24)), // Next day at midnight
//         },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         totalIncome: { $sum: "$paidAmount" },
//       },
//     },
//   ]);

//   const todayIncomeData = await Transaction.aggregate([
//     {
//       $match: {
//         createdAt: {
//           $gte: todayStart,
//           $lt: new Date(todayStart.setHours(24)), // Next day at midnight
//         },
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         totalIncome: { $sum: "$paidAmount" },
//       },
//     },
//   ]);

//   const yesterdayIncome = dailyIncomeData[0]
//     ? dailyIncomeData[0].totalIncome
//     : 0;
//   console.log("Yesterday income", yesterdayIncome);
//   const todayIncome = todayIncomeData[0] ? todayIncomeData[0].totalIncome : 0;
//   console.log("today income", todayIncome);
//   const dailyGrowth =
//     yesterdayIncome > 0
//       ? ((todayIncome - yesterdayIncome) / yesterdayIncome) * 100
//       : todayIncome > 0
//       ? todayIncome // If yesterday was 0 and today is > 0
//       : 0;

//   // Return the detailed monthly data along with growth percentages
//   return {
//     chartData: months, // Keep the monthly income data
//     yearlyGrowth: yearlyGrowth.toFixed(2) + "%", // Yearly growth percentage
//     monthlyGrowth: monthlyGrowth.toFixed(2) + "%", // Monthly growth percentage
//     dailyGrowth: dailyGrowth.toFixed(2) + "%", // Daily growth percentage
//   };
// };

// Helper function to clone a Date object
const cloneDate = (date) => new Date(date.getTime());

const getAreaChartDataForIncomeFromDB = async (year) => {
  // Create date objects for the start and end of the year
  const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
  const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const incomeData = await Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" }, // Group by month
        totalIncome: { $sum: "$paidAmount" }, // Sum the paid amounts
      },
    },
    {
      $sort: { _id: 1 }, // Sort by month
    },
  ]);

  console.log("Aggregated Income Data:", incomeData); // Log the aggregated data

  // Create an array for all months with default income of 0
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString("default", { month: "short" }), // Month names
    totalIncome: 0,
  }));

  // Map the aggregated data to the corresponding months
  incomeData.forEach((data) => {
    const monthIndex = data._id - 1; // Convert month (1-12) to index (0-11)
    if (months[monthIndex]) {
      months[monthIndex].totalIncome = data.totalIncome;
    }
  });

  // Calculate Yearly Growth
  const previousYearIncomeData = await Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year - 1}-01-01T00:00:00.000Z`),
          $lt: new Date(`${year}-01-01T00:00:00.000Z`),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$paidAmount" },
      },
    },
  ]);

  const currentYearTotalIncome = months.reduce(
    (acc, month) => acc + month.totalIncome,
    0
  );
  const previousYearTotalIncome = previousYearIncomeData[0]
    ? previousYearIncomeData[0].totalIncome
    : 0;

  const yearlyGrowth =
    previousYearTotalIncome > 0
      ? ((currentYearTotalIncome - previousYearTotalIncome) /
          previousYearTotalIncome) *
        100
      : currentYearTotalIncome > 0
      ? currentYearTotalIncome // If previous year was 0 and current year is > 0
      : 0;

  // Calculate Monthly Growth Percentages
  const currentMonthIndex = new Date().getMonth(); // Current month index (0-11)
  const previousMonthIndex =
    currentMonthIndex === 0 ? 11 : currentMonthIndex - 1; // Previous month index
  const previousMonthIncome = months[previousMonthIndex].totalIncome;

  const monthlyGrowth =
    previousMonthIncome > 0
      ? ((months[currentMonthIndex].totalIncome - previousMonthIncome) /
          previousMonthIncome) *
        100
      : months[currentMonthIndex].totalIncome > 0
      ? months[currentMonthIndex].totalIncome // If previous month was 0 and current month is > 0
      : 0;

  // Calculate Daily Growth
  const today = new Date();
  const todayStart = cloneDate(today); // Clone the original date object
  todayStart.setHours(0, 0, 0, 0); // Start of today

  const yesterdayStart = cloneDate(todayStart); // Clone the start of today
  yesterdayStart.setDate(todayStart.getDate() - 1); // Move to the previous day

  const dailyIncomeData = await Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: yesterdayStart,
          $lt: cloneDate(todayStart), // Start of today
        },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$paidAmount" },
      },
    },
  ]);

  const todayIncomeData = await Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: todayStart,
          $lt: cloneDate(todayStart).setDate(todayStart.getDate() + 1), // End of today (next day at midnight)
        },
      },
    },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$paidAmount" },
      },
    },
  ]);

  const yesterdayIncome = dailyIncomeData[0]
    ? dailyIncomeData[0].totalIncome
    : 0;
  console.log("Yesterday income", yesterdayIncome);

  const todayIncome = todayIncomeData[0] ? todayIncomeData[0].totalIncome : 0;
  console.log("today income", todayIncome);

  const dailyGrowth =
    yesterdayIncome > 0
      ? ((todayIncome - yesterdayIncome) / yesterdayIncome) * 100
      : todayIncome > 0
      ? todayIncome // If yesterday was 0 and today is > 0
      : 0;

  // Return the detailed monthly data along with growth percentages
  return {
    chartData: months, // Keep the monthly income data
    yearlyGrowth: yearlyGrowth.toFixed(2) + "%", // Yearly growth percentage
    monthlyGrowth: monthlyGrowth.toFixed(2) + "%", // Monthly growth percentage
    dailyGrowth: dailyGrowth.toFixed(2) + "%", // Daily growth percentage
  };
};

const addBanner = async (req) => {
  const { files } = req;
  if (files && typeof files === "object" && "banner_image" in files) {
    req.body.url = `${config.image_url}${files["banner_image"][0].path}`;
  }
  const result = await Banner.create(req?.body);
  return result;
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

const deleteBanner = async (id) => {
  if (!id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No id provided");
  }

  const banner = await Banner.findById(id);
  if (!banner) {
    throw new ApiError(httpStatus.NOT_FOUND, "Banner does not exist");
  }

  const result = await Banner.findByIdAndDelete(id, {
    runValidators: true,
    new: true,
  });
  return result;
};

const getBanner = async () => {
  return await Banner.find();
};

// send credit to user ------------------

const sendCreditToUser = async (userId, creditAmount) => {
  console.log(userId, creditAmount);
  const result = await User.findByIdAndUpdate(
    userId,
    {
      $inc: { availableBid: creditAmount },
    },
    { new: true, runValidators: true }
  );
  return result;
};

const DashboardServices = {
  getAllUsers,
  getSingleUser,
  blockUnblockUser,
  getDashboardMetaDataFromDB,
  addBanner,
  updateBannerIndex,
  deleteBanner,
  getAreaChartDataForIncomeFromDB,
  getBanner,
  sendCreditToUser,
};

module.exports = DashboardServices;
