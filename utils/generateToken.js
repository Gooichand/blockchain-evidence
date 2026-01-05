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
  console.warn("Warning: JWT_SECRET is not defined in environment variables.");
}

module.exports = generateToken;
