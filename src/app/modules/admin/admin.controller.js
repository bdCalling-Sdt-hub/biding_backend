const sendResponse = require("../../../shared/sendResponse");
const { AdminService } = require("./admin.service");
const catchAsync = require("../../../shared/catchasync");
const config = require("../../../config");

const registrationAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.registrationAdmin(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin registration successful",
    data: result,
  });
});

const updateAdminProfile = catchAsync(async (req, res) => {
  const result = await AdminService.updateAdminProfile(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await AdminService.deleteUser(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const loginData = req.body;
  const result = await AdminService.login(loginData);
  const { refreshToken } = result;

  // set refresh token into cookie
  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin logged in successfully!",
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  const result = await AdminService.refreshToken(refreshToken);

  // set refresh token into cookie
  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin logged in successfully!",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  await AdminService.changePassword(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully!",
  });
});

const getAllAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.getAllAdmin();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful!",
    data: result,
  });
});

const myProfile = catchAsync(async (req, res) => {
  const result = await AdminService.myProfile(req.user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Successful!",
    data: result,
  });
});

const forgotPass = catchAsync(async (req, res) => {
  await AdminService.forgotPass(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message:
      "Check your email! You can reset your password only once using this code",
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await AdminService.resetPassword(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password has been reset",
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await AdminService.deleteAdmin(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin deleted successfully",
    data: result,
  });
});

const verifyForgetPassOTP = catchAsync(async (req, res) => {
  const result = await AdminService.verifyForgetPassOTP(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Verification successful",
    data: result,
  });
});

const AdminController = {
  registrationAdmin,
  login,
  deleteUser,
  changePassword,
  refreshToken,
  updateAdminProfile,
  getAllAdmin,
  myProfile,
  forgotPass,
  resetPassword,
  deleteAdmin,
  verifyForgetPassOTP,
};

module.exports = AdminController;
