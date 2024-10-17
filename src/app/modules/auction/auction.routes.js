const express = require("express");
const auctionController = require("./auction.controller");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const simpleAuth = require("../../middlewares/simpleAuth");
const uploadFile = require("../../middlewares/fileUploader");
const router = express.Router();

router.post(
  "/create-auction",
  auth(ENUM_USER_ROLE.ADMIN),
  uploadFile(),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  auctionController.createAuction
);
router.get("/", simpleAuth, auctionController.getAllAuction);
router.get("/get-single-auction/:id", auctionController.getSingleAuction);
router.patch(
  "/update-auction/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  uploadFile(),
  (req, res, next) => {
    req.body = JSON.parse(req.body.data);
    next();
  },
  auctionController.updateAuction
);
router.delete(
  "/delete-auction/:id",
  auth(ENUM_USER_ROLE.ADMIN),
  auctionController.deleteAuction
);
router.get(
  "/get-bidding-history",
  auth(ENUM_USER_ROLE.USER),
  auctionController.getMyBiddingHistory
);

module.exports = router;
