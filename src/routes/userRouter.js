const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verify = require("../middlewares/auth");
const upload = require("../middlewares/multer.middleware");

router.get("/profile", verify, userController.getProfile);
router.patch(
  "/profile",
  verify,
  upload.single("userImage"),
  userController.updateProfile
);
router.get("/profile/all", verify, userController.getAllProfiles);
router.get("/chats", verify, userController.getUserChats);

module.exports = router;
