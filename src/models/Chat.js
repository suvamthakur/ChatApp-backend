const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
  userIds: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
  ],
  isGroup: {
    type: Boolean,
    default: false,
  },
  groupName: {
    type: String,
    maxLength: [30, "groupName should be less than 30 character"],
  },
  groupImage: {
    type: String,
    default:
      "https://www.transparentpng.com/download/user/gray-user-profile-icon-png-fP8Q1P.png",
  },
  lastMessage: {
    type: mongoose.Types.ObjectId,
    ref: "Message",
  },
  blockedBy: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Chat", chatSchema);
