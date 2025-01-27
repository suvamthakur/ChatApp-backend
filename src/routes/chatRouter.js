const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const verify = require("../middlewares/auth");
const upload = require("../middlewares/multer.middleware");

router.post(
  "/create",
  verify,
  upload.single("groupImage"),
  chatController.createChat
);
router.delete("/delete/:chatId", verify, chatController.deleteChat);
router.get("/messages/:chatId", verify, chatController.getMessages);
router.patch("/toggleBlock/:chatId", verify, chatController.toggleBlock);
router.patch("/exit/:chatId", verify, chatController.exitChat);
router.patch("/add/:chatId", verify, chatController.addUser);
router.patch("/remove/:chatId", verify, chatController.removeUser);
router.patch(
  "/update/:chatId",
  verify,
  upload.single("groupImage"),
  chatController.updateChat
);

module.exports = router;
