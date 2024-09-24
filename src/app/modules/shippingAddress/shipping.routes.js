const express = require("express");

const ShippingController = require("./shipping.controller");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const router = express.Router();

router.post(
  "/shipping-address",
  auth(ENUM_USER_ROLE.USER),
  ShippingController.createShipping
);

router.get(
  "/all-shipping",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ShippingController.getAllShipping
);

router.get(
  "/single-shipping/:id",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ShippingController.getSingleShipping
);

router.get(
  "/specific-user-shipping",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ShippingController.getSpecificUserShipping
);

module.exports = router;
