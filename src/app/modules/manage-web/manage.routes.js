const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { ManageController } = require("./manage.controller");

const router = express.Router();

router.post(
  "/create-help",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.createHelp
);
router.get("/get-help", ManageController.getHelp);
router.delete(
  "/delete-help/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.deleteHelp
);
router.post(
  "/accessibility",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.createAccessibility
);
router.get("/accessibility", ManageController.getAccessibility);
router.post(
  "/tips-and-tricks",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.createTipsAndTricks
);
// router.delete(
//   "/tips-and-tricks",
//   auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
//   ManageController.deleteTipsAndTricks
// );
router.get("/tips-and-tricks", ManageController.getTipsAndTricks);
router.post(
  "/about-us",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.createAboutUs
);
router.get("/about-us", ManageController.getAboutUs);
router.post(
  "/add-terms-conditions",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.addTermsConditions
);
router.get("/get-terms-conditions", ManageController.getTermsConditions);
router.delete(
  "/delete-terms-conditions/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.deleteTermsConditions
);
router.post(
  "/add-contact-us",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.addCustomerCare
);
router.post(
  "/delete-contact-us",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.deleteCustomerCare
);
router.post(
  "/add-privacy-policy",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.addPrivacyPolicy
);
router.get("/get-privacy-policy", ManageController.getPrivacyPolicy);
router.get("/get-contact-us", ManageController.getCustomerContact);
router.delete(
  "/delete-privacy-policy/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.deletePrivacyPolicy
);
router.post(
  "/add-faq",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.addFaq
);
router.get("/all-faq", ManageController.getAllFaq);

router.get("/get-single-faq/:id", ManageController.getSingleFaq);
router.patch(
  "/update-single-faq/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.updateSingleFaq
);
router.delete(
  "/delete-single-faq/:id",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  ManageController.deleteSingleFaq
);

module.exports = router;
