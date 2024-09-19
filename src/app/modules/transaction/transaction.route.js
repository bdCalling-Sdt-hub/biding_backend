const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const transactionController = require("./transaction.controller");
const router = express.Router();

router.get(
  "/all-transactions",
  auth(ENUM_USER_ROLE.ADMIN),
  transactionController.getAllTransaction
);

module.exports = router;
