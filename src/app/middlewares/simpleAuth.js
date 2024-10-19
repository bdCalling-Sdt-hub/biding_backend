const config = require("../../config");
const { jwtHelpers } = require("../../helpers/jwtHelpers");

const simpleAuth = async (req, res, next) => {
  try {
    const tokenWithBearer = req.headers.authorization;

    if (!tokenWithBearer) {
      return next();
    }

    if (tokenWithBearer.startsWith("Bearer")) {
      const token = tokenWithBearer.split(" ")[1];

      // Verify token
      const verifyUser = jwtHelpers.verifyToken(token, config.jwt.secret);

      req.user = verifyUser;
    }

    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = simpleAuth;
