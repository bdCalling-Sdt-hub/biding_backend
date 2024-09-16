const { UserService } = require("./user.service");
const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchasync");
const config = require("../../../config");

// checked
const registrationUser = catchAsync(async (req, res) => {
  await UserService.registrationUser(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Please check your email to activate your account",
  });
});

const activateUser = catchAsync(async (req, res) => {
  const result = await UserService.activateUser(req.body);

  const { refreshToken } = result;

  // set refresh token into cookie
  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User activated successfully",
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const loginData = req.body;

  const result = await UserService.loginUser(loginData);

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
    message: "User logged in successfully!",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const passwordData = req.body;
  const userData = req.user;
  await UserService.changePassword(userData, passwordData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully!",
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const result = await UserService.updateProfile(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const forgotPass = catchAsync(async (req, res) => {
  await UserService.forgotPass(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Check your email!",
  });
});

const resendActivationCode = catchAsync(async (req, res) => {
  const result = await UserService.resendActivationCode(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account activation code resent successfully. Check your email",
    data: result,
  });
});

const deleteMyAccount = catchAsync(async (req, res) => {
  await UserService.deleteMyAccount(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account deleted!",
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  const result = await UserService.refreshToken(refreshToken);

  // set refresh token into cookie
  const cookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  res.cookie("refreshToken", refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged in successfully!",
    data: result,
  });
});

const UserController = {
  registrationUser,
  activateUser,
  login,
  deleteMyAccount,
  changePassword,
  forgotPass,
  resendActivationCode,
  updateProfile,
  refreshToken,
};

module.exports = { UserController };
