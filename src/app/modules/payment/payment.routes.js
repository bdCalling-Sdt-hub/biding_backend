const { Router } = require("express");
const PaymentController = require("../payment/payment.controller");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");

const router = Router();

router.post(
  "/payment-with-card",
  auth(ENUM_USER_ROLE.USER),
  PaymentController.makePaymentWithCreditCard
);
// Create PayPal payment and return approval URL
router.post(
  "/create-payment",
  auth(ENUM_USER_ROLE.USER),
  PaymentController.createPaymentWithPaypal
);

// Execute payment after approval
router.post("/execute-payment", PaymentController.executePaymentWithPaypal);

// router.post(
//   "/create-payment-intent",
//   auth(ENUM_USER_ROLE.USER),
//   PaymentController.createPaymentIntent
// );

// router.post(
//   "/user/save-payment-update-spending",
//   auth(ENUM_USER_ROLE.USER),
//   PaymentController.savePaymentUpdateSpending
// );

// router.patch(
//   "/driver/update-total-earning",
//   auth(ENUM_USER_ROLE.DRIVER),
//   PaymentController.updateTotalEarning
// );

// router.get(
//   "/all-payments",
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//   PaymentController.allPayments
// );

module.exports = router;
