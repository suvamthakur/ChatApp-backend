const User = require("../models/User");

module.exports = {
  signup: async function (req, res) {
    try {
      const { name, email, password, photoURL } = req.body;

      const user = await User.create({
        name,
        email,
        password,
        photoURL,
      });

      const token = await user.getJWT();
      res.cookie("token", token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
        httpOnly: true, // Prevent JavaScript from accessing the cookie
        secure: process.env.NODE_ENV, // Only set cookies over HTTPS in production
        sameSite: "None", // Allow cross-origin cookies
      });

      res.status(201).json({
        msg: "Signup successful",
        data: user,
      });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  login: async function (req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("Invalid credentials");
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      const token = await user.getJWT();
      res.cookie("token", token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        httpOnly: true, // Prevent JavaScript from accessing the cookie
        secure: process.env.NODE_ENV, // Only set cookies over HTTPS in production
        sameSite: "None", // Allow cross-origin cookies
      });

      res.status(200).json({
        msg: "Login successful",
        data: user,
      });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  logout: async function (req, res) {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true, // Prevent JavaScript from accessing the cookie
      secure: process.env.NODE_ENV, // Only set cookies over HTTPS in production
      sameSite: "None", // Allow cross-origin cookies
    });

    res.json({ message: "Logout successful" });
  },
};
