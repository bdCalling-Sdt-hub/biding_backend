const mongoose = require("mongoose");

// Schema for products with auction features
const auctionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },

  reservedBid: { type: Number, required: true },
  incrementValue: { type: Number, required: true },

  startingDate: { type: Date, required: true },
  startingTime: { type: String, required: true }, // Time in HH:MM format

  description: { type: String, required: true },

  images: [String],
  createdAt: { type: Date, default: Date.now },
});

const Auction = mongoose.model("Auction", auctionSchema);

module.exports = Auction;
