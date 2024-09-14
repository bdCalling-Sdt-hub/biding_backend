const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const paymentSchema = new Schema(
  {
    paymentMethod: {
      type: String,
      enum: ["card"],
      required: true,
    },
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: ObjectId,
      ref: "Job",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    note: String,
  },
  {
    timestamps: true,
  }
);

const Payment = model("Payment", paymentSchema);

const transactionSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionId: {
    type: String,
    trim: true,
    unique: true,
    required: true,
  },
});

const Transaction = model("Transaction", transactionSchema);

module.exports = { Payment, Transaction };
