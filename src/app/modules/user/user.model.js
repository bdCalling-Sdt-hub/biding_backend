const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const config = require("../../../config");
const validator = require("validator");
const { ENUM_AUTH_TYPE } = require("../../../utils/enums");

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "Please provide a valid email address",
      },
    },
    phone_number: {
      type: String,
      default: "",
      // required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["USER"],
      default: "USER",
    },
    profile_image: {
      type: String,
      default:
        "https://res.cloudinary.com/arafatleo/image/upload/v1720600946/images_1_dz5srb.png",
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    activationCode: {
      type: Number,
    },
    expirationTime: {
      type: Date,
      default: () => Date.now() + 2 * 60 * 1000,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifyCode: {
      type: Number,
    },
    verifyExpire: {
      type: Date,
    },
    is_block: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      default: 0,
    },
    totalWin: {
      type: Number,
      default: 0,
    },
    availableBid: {
      type: Number,
      default: 0,
    },
    totalWin: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: "",
    },
    authType: {
      type: String,
      enum: Object.values(ENUM_AUTH_TYPE),
      default: ENUM_AUTH_TYPE.MANUAL,
    },
    shippingAddress: {
      streetAddress: {
        type: String,
        default: "",
      },
      city: {
        type: String,
        default: "",
      },
      state: {
        type: String,
        default: "",
      },
      zipCode: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Check if User exists
UserSchema.statics.isUserExist = async function (email) {
  return await this.findOne(
    { email },
    {
      _id: 1,
      email: 1,
      password: 1,
      role: 1,
      phone_number: 1,
    }
  );
};

// Check password match
UserSchema.statics.isPasswordMatched = async function (
  givenPassword,
  savedPassword
) {
  return await bcrypt.compare(givenPassword, savedPassword);
};

// Hash the password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

// Model
const User = model("User", UserSchema);

module.exports = User;
