const bcrypt = require("bcrypt");
const httpStatus = require("http-status");

const config = require("../../../config");
const ApiError = require("../../../errors/ApiError");
const { jwtHelpers } = require("../../../helpers/jwtHelpers");
const Admin = require("./admin.model");
const { sendEmail } = require("../../../utils/sendEmail");
const { logger } = require("../../../shared/logger");
const {
  registrationSuccess,
} = require("../../../mails/email.registrationSuccess");
const { ENUM_USER_ROLE } = require("../../../utils/enums");
const { sendResetEmail } = require("../../../utils/sendResetMails");
const createActivationToken = require("../../../utils/createActivationToken");
const {
  sendImageToCloudinary,
} = require("../../../helpers/sendImageToCloudinary");

const registrationAdmin = async (payload) => {
  const { name, email, password, confirmPassword } = payload;
  const admin = { name, email, password };

  const isEmailExist = await Admin.findOne({ email });

  if (isEmailExist) {
    throw new ApiError(400, "Email already exists");
  }
  if (password !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Password and Confirm Password didn't match"
    );
  }
  const data = {
    admin: { name: admin.name },
  };

  try {
    sendEmail({
      email: admin.email,
      subject: "Congratulations on successful registration",
      html: registrationSuccess(data),
    });
  } catch (error) {
    logger.error("Failed to send email:", error);
  }
  return Admin.create(payload);
};

const updateAdminProfile = async (req) => {
  const { files } = req;
  if (files && typeof files === "object" && "profile_image" in files) {
    req.body.profile_image = `${config.image_url}${files["profile_image"][0].path}`;
  }
  const userId = req?.user?.userId;
  const data = req?.body;
  console.log("profile body data", data);

  const result = await Admin.findByIdAndUpdate(userId, data, {
    runValidators: true,
    new: true,
  });
  return result;
  // let profile_image = undefined;

  // if (files && files.profile_image) {
  //   profile_image = `/images/profile/${files.profile_image[0].filename}`;
  // }

  // const data = req.body;
  // if (!data) {
  //   throw new Error(402, "Data is missing in the request body!");
  // }

  // const isExist = await Admin.findById(userId);
  // if (!isExist) {
  //   throw new ApiError(404, "Admin not found !");
  // }

  // const updatedAdminData = { ...data };

  // const result = await Admin.findOneAndUpdate(
  //   { _id: userId },
  //   { profile_image, ...updatedAdminData },
  //   {
  //     new: true,
  //   }
  // );

  // return result;
};

const login = async (payload) => {
  const { email, password } = payload;

  if (!email || !password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Please provide credentials");
  }

  const isUserExist = await Admin.isAdminExist(email);

  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin does not exist");
  }

  if (
    isUserExist.password &&
    !(await Admin.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect");
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

const refreshToken = async (token) => {
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelpers.verifyToken(token, config.jwt.refresh_secret);
  } catch (err) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid Refresh Token");
  }

  const { email } = verifiedToken;
  const isAdminExist = await Admin.isAdminExist(email);

  if (!isAdminExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin does not exist");
  }

  const newRefreshToken = jwtHelpers.createToken(
    {
      id: isAdminExist._id,
      role: isAdminExist.role,
    },
    config.jwt.secret,
    config.jwt.expires_in
  );

  return {
    refreshToken: newRefreshToken,
  };
};

const changePassword = async (user, payload) => {
  const { userId } = user;
  const { oldPassword, newPassword, confirmPassword } = payload;

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing credentials");
  }

  const isAdminExist = await Admin.findOne({ _id: userId }).select("+password");

  if (!isAdminExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin does not exist");
  }
  if (
    isAdminExist.password &&
    !(await Admin.isPasswordMatched(oldPassword, isAdminExist.password))
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Old password is incorrect");
  }

  isAdminExist.password = newPassword;
  await isAdminExist.save();
};

const forgotPass = async (payload) => {
  const { email } = payload;

  const admin = await Admin.findOne(
    { email: email },
    { _id: 1, role: 1, email: 1, name: 1 }
  );

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing credentials");
  }
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin does not exist!");
  }

  const activationCode = createActivationToken().activationCode;
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
  admin.verifyCode = activationCode;
  admin.verifyExpire = expiryTime;
  admin.verified = false;

  await admin.save();
  console.log("admin", admin);

  sendResetEmail(
    email,
    `
        <div>
          <p>Hi, ${admin.name}</p>
          <p>Your password reset code: ${activationCode}</p>
          <p>This code will be valid for the next ${expiryTime} minutes</p>
          <p>You can use this code only once</p>
          <p>You will need another code to if you attempt to change password more than once</p>
          <p>Thank you</p>
        </div>
      `
  );
};

const verifyForgetPassOTP = async (payload) => {
  const { email, verifyCode } = payload;

  const admin = await Admin.findOne({ email: email });

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin does not exist!");
  }

  if (!admin.verifyCode) {
    throw new ApiError(httpStatus.NOT_FOUND, "You have no verification code");
  }

  if (admin.verifyCode !== verifyCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid verification code!");
  }

  const currentTime = new Date();
  if (currentTime > admin.verifyExpire) {
    throw new ApiError(httpStatus.GONE, "Verification code has expired!");
  }

  await Admin.updateOne({ email: payload.email }, { $set: { verified: true } });

  return { verified: true };
};

const resetPassword = async (payload) => {
  const { email, newPassword, confirmPassword } = payload;

  if ((!email, !newPassword, !confirmPassword)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing credentials");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "newPassword & confirmPassword doesn't match"
    );
  }

  const admin = await Admin.findOne(
    { email },
    { _id: 1, verified: 1, verifyCode: 1 }
  );

  if (!admin.verifyCode) {
    throw new ApiError(httpStatus.NOT_FOUND, "You have no verification code");
  }
  if (!admin) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Admin not found!");
  }
  if (!admin.verified) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not verified. Please verify the OTP"
    );
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await Admin.updateOne({ email }, { password: hashedPassword });

  admin.verifyCode = null;
  admin.verifyExpire = null;

  await admin.save();
};

const myProfile = async (payload) => {
  const { userId } = payload;

  const result = await Admin.findById(userId);

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Profile not found");
  }

  return result;
};

const deleteAdmin = async (id) => {
  const result = await Admin.findByIdAndDelete(id);
  return result;
};

const AdminService = {
  registrationAdmin,
  updateAdminProfile,
  login,
  refreshToken,
  changePassword,
  forgotPass,
  verifyForgetPassOTP,
  resetPassword,
  myProfile,
  deleteAdmin,
};

module.exports = { AdminService };
