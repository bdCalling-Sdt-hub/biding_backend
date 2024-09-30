const express = require("express");
const auth = require("../../middlewares/auth");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const bookmarkController = require("./bookmark.controller");

const router = express.Router();

router.post(
  "/create-bookmark",
  auth(ENUM_USER_ROLE.USER),
  bookmarkController.createBookmark
);
router.get(
  "/my-bookmarks",
  auth(ENUM_USER_ROLE.USER),
  bookmarkController.getMyBookmark
);
router.delete(
  "/delete-bookmark/:auctionId",
  auth(ENUM_USER_ROLE.USER),
  bookmarkController.deleteBookmark
);

module.exports = router;
