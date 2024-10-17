const multer = require("multer");
const fs = require("fs");
const ApiError = require("../../errors/ApiError");
const httpStatus = require("http-status");
const uploadFile = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadPath = "";

      if (file.fieldname === "profile_image") {
        uploadPath = "uploads/images/profile";
      } else if (file.fieldname === "category_image") {
        uploadPath = "uploads/images/category";
      } else if (file.fieldname === "sub_category_image") {
        uploadPath = "uploads/images/sub_category";
      } else if (file.fieldname === "product_image") {
        uploadPath = "uploads/images/product";
      } else if (file.fieldname === "banner_image") {
        uploadPath = "uploads/images/banner_image";
      } else if (file.fieldname === "app_banner") {
        uploadPath = "uploads/images/app_banner";
      } else if (file.fieldname === "licence_image") {
        uploadPath = "uploads/images/licence";
      } else if (file.fieldname === "store_image") {
        uploadPath = "uploads/images/store";
      } else {
        uploadPath = "uploads";
      }

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "video/mp4" ||
        file.mimetype === "image/webp"
      ) {
        cb(null, uploadPath);
      } else {
        cb(new Error("Invalid file type"));
      }
    },
    filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      cb(null, name);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedFieldnames = [
      "image",
      "profile_image",
      "product_image",
      "category_image",
      "sub_category_image",
      "banner_image",
      "app_banner",
      "licence_image",
      "store_image",
      "video",
    ];

    if (file.fieldname === undefined) {
      // Allow requests without any files
      cb(null, true);
    } else if (allowedFieldnames.includes(file.fieldname)) {
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "video/mp4" ||
        file.mimetype === "image/webp"
      ) {
        cb(null, true);
      } else {
        cb(new Error("Invalid file type"));
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid file type");
      }
    } else {
      cb(new Error("Invalid fieldname"));
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
  }).fields([
    { name: "image", maxCount: 1 },
    { name: "profile_image", maxCount: 1 },
    { name: "category_image", maxCount: 1 },
    { name: "sub_category_image", maxCount: 1 },
    { name: "product_image", maxCount: 5 },
    { name: "banner_image", maxCount: 1 },
    { name: "app_banner", maxCount: 1 },
    { name: "licence_image", maxCount: 1 },
    { name: "store_image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]);

  return upload;
};

module.exports = uploadFile;
