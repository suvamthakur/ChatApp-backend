const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const DB_URL = process.env.DB_URL;

const connectDB = async () => {
  await mongoose.connect(DB_URL);
};

module.exports = connectDB;
