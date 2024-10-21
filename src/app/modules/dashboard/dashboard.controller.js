const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const DashboardServices = require("./dashboard.service");

// --- user ---

const getAllUsers = catchAsync(async (req, res) => {
  const { result, meta } = await DashboardServices.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    meta: meta,
    data: result,
  });
});

const getSingleUser = catchAsync(async (req, res) => {
  const result = await DashboardServices.getSingleUser(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const blockUnblockUser = catchAsync(async (req, res) => {
  const result = await DashboardServices.blockUnblockUser(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User successfully ${result?.is_block ? "blocked" : "unblocked"}`,
    data: result,
  });
});

const getDashboardMetaData = catchAsync(async (req, res) => {
  const result = await DashboardServices.getDashboardMetaDataFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Dashboard meta data successfully retrieved",
    data: result,
  });
});

const getAreaChartDataForIncome = catchAsync(async (req, res) => {
  const result = await DashboardServices.getAreaChartDataForIncomeFromDB(
    Number(req?.query?.year)
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Area chart data retrieved successfully",
    data: result,
  });
});
const addBanner = catchAsync(async (req, res) => {
  const result = await DashboardServices.addBanner(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner added successfully",
    data: result,
  });
});
const getBanner = catchAsync(async (req, res) => {
  const result = await DashboardServices.getBanner();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner retrieved successfully",
    data: result,
  });
});

const updateBannerIndex = catchAsync(async (req, res) => {
  const result = await DashboardServices.updateBannerIndex(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner Index updated successfully",
    data: result,
  });
});

const deleteBanner = catchAsync(async (req, res) => {
  const result = await DashboardServices.deleteBanner(req?.params?.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner deleted successfully",
    data: result,
  });
});

const sendCreditToUser = catchAsync(async (req, res) => {
  const result = await DashboardServices.sendCreditToUser(
    req?.params?.id,
    req?.body?.creditAmount
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Credit send successfully",
    data: result,
  });
});

const DashboardController = {
  getAllUsers,
  getSingleUser,
  blockUnblockUser,
  getDashboardMetaData,
  getAreaChartDataForIncome,
  addBanner,
  updateBannerIndex,
  deleteBanner,
  getBanner,
  sendCreditToUser,
  // getAllDriver,
  // getSingleDriver,
  // blockUnblockDriver,
  // verifyDriver,
};

module.exports = DashboardController;
