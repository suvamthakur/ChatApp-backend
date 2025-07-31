const os = require("os");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// This means the images are saved to a system folder that is outside of your project's code.
const uploadDir = path.join(os.tmpdir(), "temp_uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });
module.exports = upload;
