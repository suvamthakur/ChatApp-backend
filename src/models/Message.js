const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    chatId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Chat",
    },
    content: {
      type: String,
      maxLength: [1200, "message should be less than 1200 characters"],
      default: "",
    },
    attachment: {
      type: {
        type: String,
      },
      name: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    replyTo: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
