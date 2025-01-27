const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verify = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) throw new Error("Token is required");

    const data = await jwt.verify(token, process.env.JWT_KEY);
    if (data) {
      const userData = await User.findById(data._id);
      req.user = userData;
    } else {
      throw new Error("User verification failed");
    }
    next();
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
};

module.exports = verify;
