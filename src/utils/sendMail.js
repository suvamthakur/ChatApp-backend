require("dotenv").config();
const transporter = require("../config/nodemailer");
const Otp = require("../models/Otp");

module.exports = {
  sendOtp: async (email) => {
    try {
      const otp = `${Math.ceil(100000 + Math.random() * 800000)}`; // 100000 - 900000

      const response = await transporter.sendMail({
        from: `"WebChat " ${process.env.NODEMAILER_USER}`,
        to: email,
        subject: "OTP for login",
        html: `<b>Your OTP code is: ${otp}</b>`,
      });

      if (response.accepted.length == 0) {
        throw new Error("Nodemailer error! Unable to send email");
      }

      await Otp.create({ email, otp });
      console.log("MAIL response: ", response);
    } catch (err) {
      console.error("Error sending OTP:", err);
      throw err;
    }
  },
};
