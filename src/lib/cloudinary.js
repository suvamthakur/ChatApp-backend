const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localpath) => {
  try {
    if (!localpath) return null;
    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localpath); // removes the locally saved file
    return response;
  } catch (err) {
    console.log(err.message);
    fs.unlinkSync(localpath); // removes the locally saved file
    return null;
  }
};

module.exports = uploadOnCloudinary;
