const auth = require("../../middlewares/auth");
const express = require("express");
const notificationController = require("./notification.controller");
const { ENUM_USER_ROLE } = require("../../../utils/enums");

const router = express.Router();

router.get(
  "/get-all-notification",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  notificationController.getAllNotification
);
router.patch(
  "/see-notification",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  notificationController.seeNotification
);
router.delete(
  "/delete-notification/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.USER),
  notificationController.deleteNotification
);

module.exports = router;
