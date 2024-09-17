const { Schema, model } = require("mongoose");
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
    userName: {
      type: String,
      required: true,
    },
    item: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: "paid",
      enum: ["paid", "unpaid"],
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      default: "Online Payment",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = model("Transaction", transactionSchema);

module.exports = { Transaction };
