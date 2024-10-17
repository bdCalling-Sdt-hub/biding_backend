const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const orderController = require("./order.controller");
const router = express.Router();

router.get(
  "/get-all-orders",
  auth(ENUM_USER_ROLE.ADMIN),
  orderController.getAllOrder
);
router.get(
  "/get-single-order/:id",
  auth(ENUM_USER_ROLE.USER, ENUM_USER_ROLE.ADMIN),
  orderController.getSingleOrder
);
router.get("/my-orders", auth(ENUM_USER_ROLE.USER), orderController.getMyOrder);
router.get("/my-bids", auth(ENUM_USER_ROLE.USER), orderController.getMyBids);
router.patch(
  "/change-order-status/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  orderController.changeOrderStatus
);
router.patch(
  "/update-expected-delivery-date/:id",
  orderController.updateExpectedDeliveryDate
);
router.post(
  "/create-finance-order",
  auth(ENUM_USER_ROLE.USER),
  orderController.createFinanceOrder
);
router.patch(
  "/approve-finance-order",
  auth(ENUM_USER_ROLE.ADMIN),
  orderController.approveFinanceOrder
);
router.patch(
  "/make-paid",
  auth(ENUM_USER_ROLE.ADMIN),
  orderController.makePaid
);
module.exports = router;
