const User = require("../models/User");
const Otp = require("../models/Otp");
const Bot = require("../models/Bot");
const Chat = require("../models/Chat");
const { sendOtp } = require("../utils/sendMail");

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

      // Create a chat with BOT
      const bot = await Bot.findOne({});

      const chat = await Chat.create({
        admin: user._id,
        userIds: [bot._id, user._id],
        isBot: true,
      });

      console.log("chat: ", chat);

      try {
        await sendOtp(email);
      } catch (otpError) {
        console.error(
          "Failed to send OTP, but continuing with signup:",
          otpError.message
        );
      }

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

      if (!user.verified) {
        await sendOtp(email);
      } else {
        const token = await user.getJWT();
        res.cookie("token", token, {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
          httpOnly: true, // Prevent JavaScript from accessing the cookie
          secure: process.env.NODE_ENV, // Only set cookies over HTTPS in production
          sameSite: "None", // Allow cross-origin cookies
        });
      }

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

  verifyOtpAndSignup: async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      console.log("req body: ", req.body);
      if (!email || !otp) {
        throw createError(400, "All fields are required");
      }
      const user = await User.findOne({ email });
      if (!user) {
        throw createError(404, "User not found");
      }
      const isOtpVerified = await verifyOtp(email, otp);

      if (!isOtpVerified) {
        throw createError(400, "Invalid otp");
      }

      user.verified = true;
      await user.save();

      const token = await user.getJWT();
      res.cookie("token", token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
        httpOnly: true, // Prevent JavaScript from accessing the cookie
        secure: process.env.NODE_ENV, // Only set cookies over HTTPS in production
        sameSite: "None", // Allow cross-origin
      });

      res.status(200).json({ message: "Otp verified", data: user });
    } catch (err) {
      next(err);
    }
  },

  sendOtp: async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw createError(400, "Email missing");
      }

      const user = await User.findOne({ email });
      if (!user) {
        throw createError(404, "User not found");
      }
      await sendOtp(email);

      res.status(200).json({ message: "Otp send" });
    } catch (err) {
      next(err);
    }
  },
};

async function verifyOtp(email, otp) {
  try {
    const otpDoc = await Otp.findOne({ email }).sort({ createdAt: -1 });
    if (!otpDoc) {
      throw createError(404, "OTP not found");
    }
    console.log("OTP doc: ", otpDoc);
    console.log("user otp: ", otp);
    if (otpDoc.otp != otp) {
      throw new Error("Wrong otp");
    }
    return true;
  } catch (err) {
    console.log("Error: ", err);
    return false;
  }
}
