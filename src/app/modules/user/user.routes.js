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
router.post(
  "/auth/forgot-password",
  auth(ENUM_USER_ROLE.USER),
  UserController.forgotPass
);
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
  auth(ENUM_USER_ROLE.ADMIN),
  UserController.refreshToken
);

module.exports = router;
