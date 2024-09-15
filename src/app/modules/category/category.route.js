const express = require("express");
const categoryController = require("./category.controller");
const { upload } = require("../../../helpers/sendImageToCloudinary");
const { uploadFile } = require("../../middlewares/fileUploader");

const router = express.Router();

router.post(
  "/create-category",
  upload.single("file"),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  categoryController.createCategory
);
router.get("/", categoryController.getAllCategory);
router.patch(
  "/update-category/:id",
  uploadFile(),
  (req, res, next) => {
    req.body = JSON.parse(req?.body?.data);
    next();
  },
  categoryController.updateCategory
);

module.exports = router;
