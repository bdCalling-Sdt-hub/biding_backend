const express = require("express");
const categoryController = require("./category.controller");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const uploadFile = require("../../middlewares/fileUploader");

const router = express.Router();

router.post(
  "/create-category",
  auth(ENUM_USER_ROLE.ADMIN),
  uploadFile(),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  categoryController.createCategory
);
router.get("/", categoryController.getAllCategory);
router.patch(
  "/update-category/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  uploadFile(),
  (req, res, next) => {
    req.body = JSON.parse(req?.body?.data);
    next();
  },
  categoryController.updateCategory
);
router.delete(
  "/delete-category/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  categoryController.deleteCategory
);

module.exports = router;
