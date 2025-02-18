const mongoose = require("mongoose");
const { ENUM_AUCTION_STATUS } = require("../../../utils/enums");

// bid buddy user schema
const bidBuddyUserSchema = {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  availableBids: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
};

const bidHistorySchema = {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  bidAmount: {
    type: Number,
    required: true,
  },
  time: {
    type: Date,
    default: Date.now(),
  },
};

const uniqueBidderSchema = {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
};

const winingBidderSchema = {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  bidAmount: {
    type: Number,
    required: true,
  },
};

const auctionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // category: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },

    reservedBid: { type: Number, required: true },
    incrementValue: { type: Number, required: true },

    startingDate: { type: Date, required: true },
    startingTime: { type: String, required: true },
    endingDate: { type: Date, required: true },
    endingTime: { type: String, required: true },

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
    currentPrice: {
      type: Number,
      default: 0,
    },
    bidBuddyUsers: {
      type: [bidBuddyUserSchema],
    },
    bidHistory: {
      type: [bidHistorySchema],
    },
    totalBidPlace: {
      type: Number,
      default: 0,
    },
    countdownTime: {
      type: Number,
      default: null,
    },
    winingBidder: {
      type: winingBidderSchema,
      default: null,
    },
    activateTime: {
      type: Date,
    },
    startingDateTime: {
      type: Date,
    },
    endedTime: {
      type: Date,
      default: null,
    },
    financeAvailable: {
      type: Boolean,
      default: false,
    },
    totalMonthForFinance: {
      type: Number,
    },
    countdownTime: {
      type: Number,
      default: 0,
    },
    uniqueBidders: {
      type: [uniqueBidderSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

auctionSchema.index({ "bidBuddyUsers.user": 1 }); // Index on bidBuddyUsers.user
auctionSchema.index({ "bidHistory.user": 1 }); // Index on bidHistory.user

const Auction = mongoose.model("Auction", auctionSchema);

module.exports = Auction;
