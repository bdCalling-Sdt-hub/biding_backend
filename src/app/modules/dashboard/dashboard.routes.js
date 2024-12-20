const auth = require("../../middlewares/auth");
const express = require("express");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const DashboardController = require("./dashboard.controller");
const uploadFile = require("../../middlewares/fileUploader");

const router = express.Router();

router.get(
  "/auth/get-all-user",
  auth(ENUM_USER_ROLE.ADMIN),
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
router.post(
  "/create-banner",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  uploadFile(),
  DashboardController.addBanner
);

router.get("/get-banner", DashboardController.getBanner);

router.patch(
  "/auth/update-banner-index",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  DashboardController.updateBannerIndex
);

router.delete(
  "/delete-banner/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  DashboardController.deleteBanner
);

router.get(
  "/get-dashboard-meta-data",
  auth(ENUM_USER_ROLE.ADMIN),
  DashboardController.getDashboardMetaData
);
router.get(
  "/get-income-chart-data",
  auth(ENUM_USER_ROLE.ADMIN),
  DashboardController.getAreaChartDataForIncome
);

router.post(
  "/send-credit/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  DashboardController.sendCreditToUser
);

module.exports = router;
