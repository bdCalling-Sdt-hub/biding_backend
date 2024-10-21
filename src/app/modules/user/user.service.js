const cron = require("node-cron");
const httpStatus = require("http-status");
const bcrypt = require("bcrypt");
const ApiError = require("../../../errors/ApiError");
const User = require("./user.model");
const config = require("../../../config");
const { jwtHelpers } = require("../../../helpers/jwtHelpers");
const { sendEmail } = require("../../../utils/sendEmail");
const {
  registrationSuccessEmailBody,
} = require("../../../mails/email.register");
const { sendResetEmail } = require("../../../utils/sendResetMails");
const { logger } = require("../../../shared/logger");
const createActivationToken = require("../../../utils/createActivationToken");
const { ENUM_AUTH_TYPE } = require("../../../utils/enums");
const Shipping = require("../shippingAddress/shipping.model");

const registrationUser = async (payload) => {
  const { name, email, password, confirmPassword, phone_number } = payload;

  const user = {
    name,
    email,
    password,
    confirmPassword,
    phone_number,
    expirationTime: Date.now() + 10 * 60 * 1000,
  };

  const existingUser = await User.findOne({ email });

  if (existingUser && !existingUser?.verified) {
    const user = await User.find({ email });
    return {
      message: "You have already registered. Please verify",
      user,
    };
  }
  if (existingUser) {
    throw new ApiError(400, "Email already exists");
  }

  if (password !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password and Confirm Password didn't match"
    );
  }

  const activationToken = createActivationToken();
  const activationCode = activationToken.activationCode;
  const data = {
    user: { name: name, email },
    activationCode,
    email,
  };

  try {
    sendEmail({
      email: email,
      subject: "Activate Your Account",
      html: registrationSuccessEmailBody(data),
    });
  } catch (error) {
    throw new ApiError(500, error.message);
  }

  user.activationCode = activationCode;

  const createUser = await User.create(user);

  const shippingAddress = {
    user_id: createUser._id,
    user_name: "",
    email: "",
    phone_number: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
  };
  await Shipping.create(shippingAddress);

  return createUser;
};

const activateUser = async (payload) => {
  const { email, activation_code } = payload;

  const existUser = await User.findOne({ email: email });

  if (!existUser) {
    throw new ApiError(400, "User not found");
  }
  if (existUser.activationCode !== Number(activation_code)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Code didn't match");
  }

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { isActive: true, verified: true } },
    {
      new: true,
      runValidators: true,
      projection: { verified: 1 },
    }
  );

  const accessToken = jwtHelpers.createToken(
    {
      userId: existUser._id,
      email: existUser.email,
      role: existUser.role,
    },
    config.jwt.secret,
    config.jwt.expires_in
  );

  // Create refresh token
  const refreshToken = jwtHelpers.createToken(
    {
      userId: existUser._id,
      email: existUser.email,
      role: existUser.role,
    },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const verifyForgetPassOTP = async (payload) => {
  const { email, verifyCode } = payload;

  if (!email || !verifyCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing email or code");
  }

  const user = await User.findOne(
    { email },
    { verifyCode: 1, verifyExpire: 1 }
  );

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist!");
  }
  if (!user.verifyCode) {
    throw new ApiError(httpStatus.NOT_FOUND, "You have no verification code");
  }
  if (user.verifyCode !== verifyCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid verification code!");
  }
  if (new Date() > user.verifyExpire) {
    throw new ApiError(httpStatus.GONE, "Verification code has expired!");
  }

  return await User.findOneAndUpdate(
    { email },
    { $set: { verified: true } },
    {
      new: true,
      runValidators: true,
      projection: { verified: 1 },
    }
  );
};

const resetPassword = async (payload) => {
  const { email, newPassword, confirmPassword } = payload;

  if (!email || !newPassword || !confirmPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing credentials");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "newPassword & confirmPassword doesn't match"
    );
  }

  const user = await User.findOne(
    { email },
    { _id: 1, verified: 1, verifyCode: 1 }
  );

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Client not found!");
  }
  if (!user.verifyCode) {
    throw new ApiError(httpStatus.NOT_FOUND, "You have no verification code");
  }
  if (!user.verified) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not verified. Please verify the OTP"
    );
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await User.updateOne({ email }, { password: hashedPassword });

  user.verifyCode = null;
  user.verifyExpire = null;

  await user.save();
};

// Scheduled task to delete expired inactive users------------------------------
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const result = await User.deleteMany({
      isActive: false,
      expirationTime: { $lte: now },
    });
    if (result.deletedCount > 0) {
      logger.info(`Deleted ${result.deletedCount} expired inactive users`);
    }
  } catch (error) {
    logger.error("Error deleting expired users:", error);
  }
});

const loginUser = async (payload) => {
  const { email, password } = payload;

  const isUserExist = await User.findOne({ email }).select("+password");

  if (!isUserExist) {
    throw new ApiError(404, "User does not exist");
  }
  if (isUserExist.is_block) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You are blocked by admin");
  }
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(402, "Password is incorrect");
  }
  if (isUserExist.isActive === false) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Please activate your account then try to login"
    );
  }

  const { _id: userId, role } = isUserExist;

  const accessToken = jwtHelpers.createToken(
    { userId, email, role },
    config.jwt.secret,
    config.jwt.expires_in
  );

  const refreshToken = jwtHelpers.createToken(
    { userId, email, role },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  return {
    accessToken,
    refreshToken,
  };
};

const signUPWithGoogle = async (payload) => {
  const userExist = await User.findOne({ email: payload?.email });
  if (userExist) {
    const userId = userExist?._id;
    const email = userExist?.email;
    const role = userExist?.role;
    const accessToken = jwtHelpers.createToken(
      { userId, email, role },
      config.jwt.secret,
      config.jwt.expires_in
    );
    const refreshToken = jwtHelpers.createToken(
      { userId, email, role },
      config.jwt.refresh_secret,
      config.jwt.refresh_expires_in
    );

    return {
      accessToken,
      refreshToken,
      user: userExist,
    };
  }

  const createUser = await User.create({
    ...payload,
    password: "google",
    verified: true,
    isActive: true,
    authType: ENUM_AUTH_TYPE.GOOGLE,
  });
  const userId = createUser?._id;
  const email = createUser?.email;
  const role = createUser?.role;
  const accessToken = jwtHelpers.createToken(
    { userId, email, role },
    config.jwt.secret,
    config.jwt.expires_in
  );
  const refreshToken = jwtHelpers.createToken(
    { userId, email, role },
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  return {
    accessToken,
    refreshToken,
    user: userExist,
  };
};

const getMyProfileFromDB = async (userId) => {
  const result = await User.findById(userId);
  return result;
};

const updateProfile = async (req) => {
  const { files } = req;
  if (files && typeof files === "object" && "profile_image" in files) {
    req.body.profile_image = `${config.image_url}${files["profile_image"][0].path}`;
  }
  const userId = req?.user?.userId;
  const data = req?.body;
  const checkValidUser = await User.findById(userId);
  if (!checkValidUser) {
    throw new ApiError(404, "You are not authorized");
  }

  const result = await User.findByIdAndUpdate(userId, data, {
    runValidators: true,
    new: true,
  });
  return result;
};

const myProfile = async (payload) => {
  const { userId } = payload;

  const result = await User.findById(userId);

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Profile not found");
  }

  return result;
};

const deleteMyAccount = async (payload) => {
  const { email, password } = payload;

  const isUserExist = await User.isUserExist(email);

  if (!isUserExist) {
    throw new ApiError(404, "User does not exist");
  }
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(402, "Password is incorrect");
  }

  return await User.findOneAndDelete({ email });
};

const changePassword = async (user, payload) => {
  const { userId } = user;
  const { oldPassword, newPassword, confirmPassword } = payload;

  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password and Confirm password do not match"
    );
  }

  const isUserExist = await User.findOne({ _id: userId }).select("+password");

  if (!isUserExist) {
    throw new ApiError(404, "User does not exist");
  }
  if (
    isUserExist.password &&
    !(await User.isPasswordMatched(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(402, "Old password is incorrect");
  }

  isUserExist.password = newPassword;
  await isUserExist.save();
};

const forgotPass = async (payload) => {
  const user = await User.findOne(
    { email: payload.email },
    { email: 1, name: 1 }
  );

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist!");
  }

  const verifyCode = createActivationToken().activationCode;
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
  user.verifyCode = verifyCode;
  user.verifyExpire = expiryTime;

  await user.save();

  sendResetEmail(
    user.email,
    `
        <div>
          <p>Hi, ${user.name}</p>
          <p>Your password reset Code: ${verifyCode}</p>
          <p>Thank you</p>
        </div>
      `
  );
};

const resendActivationCode = async (payload) => {
  const { email } = payload;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist!");
  }

  const activationCode = createActivationToken().activationCode;
  const expiryTime = new Date(Date.now() + 5 * 60 * 1000);
  user.activationCode = activationCode;
  user.expirationTime = expiryTime;

  await user.save();

  sendResetEmail(
    user.email,
    `
      <div>
        <p>Hi, ${user.name}</p>
        <p>Your new activation Code: ${activationCode}</p>
        <p>Use it within the next 5 minutes</p>
        <p>Thank you</p>
      </div>
    `,
    "Activation Code"
  );
};

const refreshToken = async (token) => {
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(token, config.jwt.refresh_secret);
  } catch (err) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid Refresh Token");
  }

  const { email } = verifiedToken;
  const isUserExist = await User.isUserExist(email);

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  const newRefreshToken = jwtHelpers.createToken(
    {
      id: isUserExist._id,
      role: isUserExist.role,
    },
    config.jwt.secret,
    config.jwt.expires_in
  );

  return {
    refreshToken: newRefreshToken,
  };
};

const activateUser2 = async (query) => {
  console.log(query);
};

const updateShippingAddress = async (payload) => {
  const { userId } = payload;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "missing user id");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Profile not found");
  }

  return await User.findByIdAndUpdate(
    { _id: userId },
    { $set: { shippingAddress: { ...user.shippingAddress, ...payload } } }, // Merge existing shippingAddress with payload
    { new: true, runValidators: true }
  ).select({ shippingAddress: 1 });
};

const UserService = {
  registrationUser,
  loginUser,
  signUPWithGoogle,
  getMyProfileFromDB,
  changePassword,
  updateProfile,
  forgotPass,
  resetPassword,
  verifyForgetPassOTP,
  activateUser,
  activateUser2,
  deleteMyAccount,
  resendActivationCode,
  refreshToken,
  myProfile,
  updateShippingAddress,
};

module.exports = { UserService };
