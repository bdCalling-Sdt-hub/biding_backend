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

// get area chart data
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
//   const months = [
//     { month: "January", totalIncome: 0 },
//     { month: "February", totalIncome: 0 },
//     { month: "March", totalIncome: 0 },
//     { month: "April", totalIncome: 0 },
//     { month: "May", totalIncome: 0 },
//     { month: "June", totalIncome: 0 },
//     { month: "July", totalIncome: 0 },
//     { month: "August", totalIncome: 0 },
//     { month: "September", totalIncome: 0 },
//     { month: "October", totalIncome: 0 },
//     { month: "November", totalIncome: 0 },
//     { month: "December", totalIncome: 0 },
//   ];

//   // Map the aggregated data to the corresponding months
//   incomeData.forEach((data) => {
//     const monthIndex = data._id - 1; // Convert month (1-12) to index (0-11)
//     if (months[monthIndex]) {
//       months[monthIndex].totalIncome = data.totalIncome;
//     }
//   });

//   return months;
// };

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
      ? 100 // If previous year was 0 and current year is > 0
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
      ? 100 // If previous month was 0 and current month is > 0
      : 0;

  // Calculate Daily Growth
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const yesterdayStart = new Date(today.setDate(today.getDate() - 1));

  const dailyIncomeData = await Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: yesterdayStart,
          $lt: new Date(yesterdayStart.setHours(24)), // Next day at midnight
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
          $lt: new Date(todayStart.setHours(24)), // Next day at midnight
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
  const todayIncome = todayIncomeData[0] ? todayIncomeData[0].totalIncome : 0;

  const dailyGrowth =
    yesterdayIncome > 0
      ? ((todayIncome - yesterdayIncome) / yesterdayIncome) * 100
      : todayIncome > 0
      ? 100 // If yesterday was 0 and today is > 0
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
  getAreaChartDataForIncomeFromDB,
  // getAllDriver,
  // getSingleDriver,
  // blockUnblockDriver,
  // verifyDriver,
};

module.exports = DashboardServices;
