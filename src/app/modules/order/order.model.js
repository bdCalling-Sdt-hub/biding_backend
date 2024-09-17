const { Schema, default: mongoose } = require("mongoose");
const { ENUM_PAID_BY, ENUM_DELIVERY_STATUS } = require("../../../utils/enums");
const statusWithTimeSchema = new Schema({
  status: {
    type: String,
    enum: Object.values(ENUM_DELIVERY_STATUS),
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
});
const orderSchema = new Schema({
  shippingAddress: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Shipping",
  },
  item: {
    type: String,
    required: true,
  },
  winingBid: {
    type: Number,
    required: true,
  },
  paidBy: {
    type: String,
    required: true,
    enum: Object.values(ENUM_PAID_BY),
  },
  status: {
    type: String,
    default: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
    enum: Object.values(ENUM_DELIVERY_STATUS),
  },
  statusWithTime: [statusWithTimeSchema],
});

const Order = mongoose.model("Order", orderSchema);
