const express = require("express");
const auctionController = require("./auction.controller");

const router = express.Router();

router.post("/create-auction", auctionController.createAuction);
