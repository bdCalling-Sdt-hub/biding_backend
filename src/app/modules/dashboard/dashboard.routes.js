const auth = require("../../middlewares/auth");
const express = require("express");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { uploadFile } = require("../../middlewares/fileUploader");
const DashboardController = require("./dashboard.controller");

const router = express.Router();

// --- user ---

router.get(
  "/auth/get-all-user",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  DashboardController.getAllUsers
);

router.get(
  "/auth/get-single-user",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  DashboardController.getSingleUser
);

router.patch(
  "/auth/block-unblock-user",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  DashboardController.blockUnblockUser
);

// --- banner ---

router.post(
  "/auth/banner",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile(),
  DashboardController.addBanner
);

router.patch(
  "/auth/update-banner-index",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  DashboardController.updateBannerIndex
);

router.delete(
  "/auth/banner",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  DashboardController.deleteBanner
);

// --- driver ---

// router.get(
//   "/auth/get-all-driver",
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//   DashboardController.getAllDriver
// );

// router.get(
//   "/auth/get-single-driver",
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//   DashboardController.getSingleDriver
// );

// router.patch(
//   "/auth/block-unblock-driver",
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//   DashboardController.blockUnblockDriver
// );

// router.patch(
//   "/auth/verify-driver",
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//   DashboardController.verifyDriver
// );

// -------------

// router.post(
//   "/auth/add-user",
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//   AdminController.createUser
// );

// router.get(
//   "/auth/admins",
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//   AdminController.getAllAdmin
// );

module.exports = router;
