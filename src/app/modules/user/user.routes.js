const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { uploadFile } = require("../../middlewares/fileUploader");
const { UserController } = require("../user/user.controller");

const router = express.Router();

router.post("/auth/register", UserController.registrationUser);
router.post("/auth/activate-user", UserController.activateUser);
router.post("/auth/login", UserController.login);
router.delete(
  "/auth/delete-account",
  auth(ENUM_USER_ROLE.USER),
  UserController.deleteMyAccount
);
router.patch(
  "/auth/change-password",
  auth(ENUM_USER_ROLE.USER),
  UserController.changePassword
);
router.post("/auth/forgot-password", UserController.forgotPass);
router.get(
  "/auth/profile",
  auth(ENUM_USER_ROLE.USER),
  UserController.myProfile
);
router.patch(
  "/auth/verify-otp-forgot-password",
  UserController.verifyForgetPassOTP
);
router.patch("/auth/reset-password", UserController.resetPassword);

router.post(
  "/auth/resend-activation-code",
  UserController.resendActivationCode
);
router.patch(
  "/auth/update-profile",
  auth(ENUM_USER_ROLE.USER),
  uploadFile(),
  UserController.updateProfile
);
router.post(
  "/auth/refresh-token",
  auth(ENUM_USER_ROLE.USER),
  UserController.refreshToken
);
router.patch(
  "/update-shipping-address",
  auth(ENUM_USER_ROLE.USER),
  UserController.updateShippingAddress
);

// =====
router.get("/activate-user-2", UserController.activateUser2);

module.exports = router;
