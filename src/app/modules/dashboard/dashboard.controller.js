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

// // --- driver ---

// const getAllDriver = catchAsync(async (req, res) => {
//   const { meta, result } = await DashboardServices.getAllDriver(req.query);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "User retrieved successfully",
//     data: result,
//     meta,
//   });
// });

// const getSingleDriver = catchAsync(async (req, res) => {
//   const result = await DashboardServices.getSingleDriver(req.body);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "User retrieved successfully",
//     data: result,
//   });
// });

// const blockUnblockDriver = catchAsync(async (req, res) => {
//   const result = await DashboardServices.blockUnblockDriver(req.body);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "User retrieved successfully",
//     data: result,
//   });
// });

// const verifyDriver = catchAsync(async (req, res) => {
//   const result = await DashboardServices.verifyDriver(req.body);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Driver verified successfully",
//     data: result,
//   });
// });

// // ---------------

// // const createUser = catchAsync(async (req, res) => {
// //   const userData = req.body;

// //   const result = await AdminService.createUser(userData);

// //   sendResponse(res, {
// //     statusCode: 200,
// //     success: true,
// //     message: "User created successfully",
// //     data: result,
// //   });
// // });

const DashboardController = {
  getAllUsers,
  getSingleUser,
  blockUnblockUser,
  getDashboardMetaData,
  // getAllDriver,
  // getSingleDriver,
  // blockUnblockDriver,
  // verifyDriver,
};

module.exports = DashboardController;
