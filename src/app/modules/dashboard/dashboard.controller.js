const catchAsync = require("../../../shared/catchasync");
const sendResponse = require("../../../shared/sendResponse");
const DashboardServices = require("./dashboard.service");

// --- user ---

const getAllUsers = catchAsync(async (req, res) => {
  console.log("get all user");
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
    message: "User retrieved successfully",
    data: result,
  });
});

const getDashboardMetaData = catchAsync(async (req, res) => {
  const result = await DashboardServices.getDashboardMetaDataFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
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
  const result = await DashboardServices.deleteBanner(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Banner deleted successfully",
    data: result,
  });
});

const DashboardController = {
  getAllUsers,
  getSingleUser,
  blockUnblockUser,
  getDashboardMetaData,
  addBanner,
  updateBannerIndex,
  deleteBanner,
  getBanner,
  // getAllDriver,
  // getSingleDriver,
  // blockUnblockDriver,
  // verifyDriver,
};

module.exports = DashboardController;
