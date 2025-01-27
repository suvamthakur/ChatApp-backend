const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxLength: [30, "name should be less than 30 character"],
    required: true,
  },

  email: {
    type: String,
    required: true,
    trim: true,
    required: true,
    unique: true,
    match: /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/,
  },

  password: {
    type: String,
    require: true,
    validate(value) {
      if (!validator.isStrongPassword(value)) {
        throw new Error("Enter a strong passsword");
      }
    },
  },

  photoURL: {
    type: String,
    default:
      "https://www.transparentpng.com/download/user/gray-user-profile-icon-png-fP8Q1P.png",
    validate(value) {
      if (!validator.isURL(value)) {
        throw new Error("Invalid photo url");
      }
    },
  },
});

// Middleware to hash password before save
userSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.getJWT = async function () {
  const token = await jwt.sign(
    { _id: this._id, email: this.email },
    process.env.JWT_KEY,
    {
      expiresIn: "7d",
    }
  );

  return token;
};

userSchema.methods.validatePassword = async function (password) {
  const hashPassword = this.password;
  return await bcrypt.compare(password, hashPassword);
};

module.exports = new mongoose.model("User", userSchema);
