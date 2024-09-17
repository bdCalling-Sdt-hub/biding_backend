const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const orderController = require("./order.controller");
const router = express.Router();

router.get("/", auth(ENUM_USER_ROLE.ADMIN), orderController.getAllOrder);
router.get("/my-orders", auth(ENUM_USER_ROLE.USER), orderController.getMyOrder);
module.exports = router;
