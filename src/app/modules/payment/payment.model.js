const { Schema, model } = require("mongoose");
const { ENUM_PAYMENT_STATUS, ENUM_ITEM_TYPE } = require("../../../utils/enums");
const ObjectId = Schema.Types.ObjectId;

// const paymentSchema = new Schema(
//   {
//     paymentMethod: {
//       type: String,
//       enum: ["card"],
//       required: true,
//     },
//     user: {
//       type: ObjectId,
//       ref: "User",
//       required: true,
//     },
//     job: {
//       type: ObjectId,
//       ref: "Job",
//       required: true,
//     },
//     amount: {
//       type: Number,
//       required: true,
//     },
//     transactionId: {
//       type: String,
//       trim: true,
//       unique: true,
//       required: true,
//     },
//     note: String,
//   },
//   {
//     timestamps: true,
//   }
// );

// const Payment = model("Payment", paymentSchema);

const transactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    item: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: ENUM_PAYMENT_STATUS.PAID,
      enum: Object.values(ENUM_PAYMENT_STATUS),
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    paymentType: {
      type: String,
      default: "Online Payment",
    },
    itemType: {
      type: String,
      enum: Object.values(ENUM_ITEM_TYPE),
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = model("Transaction", transactionSchema);

module.exports = { Transaction };
