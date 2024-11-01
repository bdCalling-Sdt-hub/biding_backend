const auth = require("../../middlewares/auth");
const express = require("express");
const { ENUM_USER_ROLE } = require("../../../utils/enums");

const AdminController = require("../admin/admin.controller");
const uploadFile = require("../../middlewares/fileUploader");

const router = express.Router();

// router.post("/auth/register", AdminController.registrationAdmin);
router.post("/auth/login", AdminController.login);
router.patch("/auth/forgot-password", AdminController.forgotPass);
router.patch(
  "/auth/verify-otp-forgot-password",
  AdminController.verifyForgetPassOTP
);
router.patch("/auth/reset-password", AdminController.resetPassword);
router.patch(
  "/auth/change-password",
  auth(ENUM_USER_ROLE.ADMIN),
  AdminController.changePassword
);
router.patch(
  "/auth/update-profile",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile(),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  AdminController.updateAdminProfile
);
router.get(
  "/auth/profile",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AdminController.myProfile
);
router.delete(
  "/auth/delete-admin/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  AdminController.deleteAdmin
);
router.post(
  "/auth/refresh-token",
  auth(ENUM_USER_ROLE.ADMIN),
  AdminController.refreshToken
);

module.exports = router;
