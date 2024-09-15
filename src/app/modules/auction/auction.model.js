const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },

    reservedBid: { type: Number, required: true },
    incrementValue: { type: Number, required: true },

    startingDate: { type: Date, required: true },
    startingTime: { type: String, required: true }, // Time in HH:MM format

    description: { type: String, required: true },

    images: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Auction = mongoose.model("Auction", auctionSchema);

module.exports = Auction;
