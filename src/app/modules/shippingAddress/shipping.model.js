const { Schema, model } = require("mongoose");

const shippingSchema = new Schema(
  {
    user_id: {
      type: Schema.ObjectId,
      ref: "User",
      required: true,
    },
    user_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    streetAddress: String,
    city: String,
    state: String,
    zipCode: Number,
  },
  {
    timestamps: true,
  }
);

const Shipping = model("Shipping", shippingSchema);

module.exports = Shipping;
