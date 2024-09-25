const config = require("../../config");
const { jwtHelpers } = require("../../helpers/jwtHelpers");

const simpleAuth = async (req, res, next) => {
  try {
    const tokenWithBearer = req.headers.authorization;

    // Check if the token exists
    if (!tokenWithBearer) {
      return next(); // Do nothing if no token is present
    }

    if (tokenWithBearer.startsWith("Bearer")) {
      const token = tokenWithBearer.split(" ")[1];

      // Verify token
      const verifyUser = jwtHelpers.verifyToken(token, config.jwt.secret);

      req.user = verifyUser; // Set the user in the request object
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.log(error);
    next(error); // Pass any errors to the error handling middleware
  }
};

module.exports = simpleAuth;
