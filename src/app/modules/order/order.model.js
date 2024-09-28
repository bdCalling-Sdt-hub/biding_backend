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
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  shippingAddress: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Shipping",
  },
  // item: {
  //   type: String,
  //   required: true,
  // },
  item: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Auction",
  },
  winingBid: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  paidBy: {
    type: String,
    required: true,
    enum: Object.values(ENUM_PAID_BY),
    validate: {
      validator: function (value) {
        return Object.values(ENUM_PAID_BY).includes(value);
      },
      message: (props) => `${props.value} is not a valid payment method!`,
    },
  },
  status: {
    type: String,
    default: ENUM_DELIVERY_STATUS.PAYMENT_SUCCESS,
    enum: Object.values(ENUM_DELIVERY_STATUS),
    validate: {
      validator: function (value) {
        return Object.values(ENUM_DELIVERY_STATUS).includes(value);
      },
      message: (props) => `${props.value} is not a valid delivery status!`,
    },
  },
  statusWithTime: [statusWithTimeSchema],
  expectedDeliveryData: {
    type: Date,
    default: null,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
