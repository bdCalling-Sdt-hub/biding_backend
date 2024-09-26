const { Schema, default: mongoose } = require("mongoose");

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    receiver: {
      type: String,
      // required: true,
    },
  },

  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
