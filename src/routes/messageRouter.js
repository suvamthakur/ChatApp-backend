const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const verify = require("../middlewares/auth");
const upload = require("../middlewares/multer.middleware");

router.post(
  "/create/:chatId",
  verify,
  upload.single("file"),
  messageController.addMessage
);
router.delete("/delete/:messageId", verify, messageController.deleteMessage);

module.exports = router;
