const { Schema, default: mongoose } = require("mongoose");

const bookmarkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    auction: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Auction",
    },
  },
  {
    timestamps: true,
  }
);

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

module.exports = Bookmark;
