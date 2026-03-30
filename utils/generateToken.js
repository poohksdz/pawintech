const jwt = require("jsonwebtoken");

// Assuming `generateToken` is setting the token in the cookie and returning it
const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // Set the token in an HTTP-only cookie
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // for HTTPS
    sameSite: "strict", // ป้องกัน CSRF (Cross-Site Request Forgery)
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Return the token so you can send it in the response body
  return token;
};

module.exports = generateToken;
