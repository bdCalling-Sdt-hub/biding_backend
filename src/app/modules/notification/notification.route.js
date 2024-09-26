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

module.exports = router;
