const mongoose = require("mongoose");
const { ENUM_AUCTION_STATUS } = require("../../../utils/enums");

const auctionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },

    reservedBid: { type: Number, required: true },
    incrementValue: { type: Number, required: true },

    startingDate: { type: Date, required: true },
    startingTime: { type: String, required: true },

    description: { type: String, required: true },

    images: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ENUM_AUCTION_STATUS),
      default: ENUM_AUCTION_STATUS.UPCOMING,
    },
  },
  {
    timestamps: true,
  }
);

const Auction = mongoose.model("Auction", auctionSchema);

module.exports = Auction;
