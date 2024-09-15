const express = require("express");
const auctionController = require("./auction.controller");
const { uploadFile } = require("../../middlewares/fileUploader");

const router = express.Router();

router.post(
  "/create-auction",
  uploadFile(),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  auctionController.createAuction
);
router.get("/", auctionController.getAllAuction);
router.patch(
  "/update-auction/:id",
  uploadFile(),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  auctionController.updateAuction
);

module.exports = router;
