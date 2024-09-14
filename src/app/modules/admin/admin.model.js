const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const config = require("../../../config");

const { Schema, model } = mongoose;

const AdminSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone_number: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    date_of_birth: {
      type: Date,
    },
    profile_image: {
      type: String,
      default:
        "https://st3.depositphotos.com/15648834/17930/v/450/depositphotos_179308454-stock-illustration-unknown-person-silhouette-glasses-profile.jpg",
    },
    verifyCode: {
      type: Number,
    },
    verifyExpire: {
      type: Date,
    },
    role: {
      type: String,
      enum: ["ADMIN", "SUPER_ADMIN"],
      default: "ADMIN",
    },
    verified: {
      type: Boolean,
      default: true,
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

AdminSchema.statics.isAdminExist = async function (email) {
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

AdminSchema.statics.isPasswordMatched = async function (
  givenPassword,
  savedPassword
) {
  return await bcrypt.compare(givenPassword, savedPassword);
};

// Hash the password
AdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

const Admin = model("Admin", AdminSchema);

module.exports = Admin;
