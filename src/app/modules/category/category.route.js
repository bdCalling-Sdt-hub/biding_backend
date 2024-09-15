const express = require("express");
const categoryController = require("./category.controller");
const { upload } = require("../../../helpers/sendImageToCloudinary");

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

module.exports = router;
