const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const transactionController = require("./transaction.controller");
const router = express.Router();

router.get(
  "/get-all-transaction",
  auth(ENUM_USER_ROLE.ADMIN),
  transactionController.getAllTransaction
);
router.get(
  "/get-single-transaction/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  transactionController.getSingleTransaction
);

module.exports = router;
