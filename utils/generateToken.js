const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );
};

if (!process.env.JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET is not defined in environment variables. Application cannot start without it.");
}

module.exports = generateToken;
