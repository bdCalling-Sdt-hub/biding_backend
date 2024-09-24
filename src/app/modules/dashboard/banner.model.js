const { Schema, model } = require("mongoose");

const bannerSchema = new Schema(
  {
    index: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Banner = model("Banner", bannerSchema);

module.exports = Banner;
