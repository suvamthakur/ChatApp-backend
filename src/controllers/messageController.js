const uploadOnCloudinary = require("../lib/cloudinary");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

module.exports = {
  addMessage: async function (req, res) {
    try {
      const senderId = req.user._id;
      const chatId = req.params.chatId;

      const content = req.body.content;
      const replyTo = req.body.replyTo && JSON.parse(req.body.replyTo);

      const chatData = await Chat.findById(chatId);
      if (!chatData) {
        throw new Error("Invalid chatId");
      }
      if (chatData.blockedBy) {
        throw new Error("User is blocked");
      }
      if (!chatData.userIds.includes(senderId)) {
        throw new Error("You are not part of this chat");
      }

      // If file exists
      let attachment;
      if (req.file) {
        // upto 40mb (41943040 byte)
        if (req.file.size > 41943040) {
          throw new Error("File size should be less than 40mb");
        }

        attachment = {};
        attachment.type = req.file.mimetype;
        attachment.name = req.file.originalname;

        // Upload on cloudinary
        const response = await uploadOnCloudinary(req.file.path);
        attachment.url = response.url;
      } else {
        attachment = null;
      }

      const message = await Message.create({
        senderId,
        chatId,
        content,
        attachment,
        replyTo,
      });

      // Update lastMessage in the Chat
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
      });

      const sender = req.user;
      const messageData = {
        ...message.toObject(),
        senderName: sender.name,
        photoURL: sender.photoURL,
      };

      res
        .status(201)
        .json({ msg: "Message added successfully", data: messageData });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  deleteMessage: async function (req, res) {
    try {
      const messsageId = req.params.messageId;
      const userId = req.user._id;

      // Check who is deleting the message
      const messageData = await Message.findById(messsageId);
      const chatData = await Chat.findById(messageData.chatId);

      if (chatData.isGroup) {
        if (
          !chatData.admin.equals(userId) &&
          !messageData.senderId.equals(userId)
        ) {
          console.log(chatData.admin, userId);
          throw new Error("Message can't be deleted");
        }
      } else {
        if (!messageData.senderId.equals(userId)) {
          throw new Error("Message can't be deleted");
        }
      }
      await Message.findByIdAndDelete(messsageId);

      // Updated last message
      // Check if the user has deleted the last message of the Chat or not
      if (chatData.lastMessage == messsageId) {
        const message = await Message.findOne({ chatId: chatData._id }).sort({
          _id: -1,
        });

        // Check if the chat has left with any message or not
        if (message) {
          chatData.lastMessage = message._id;
        } else {
          chatData.lastMessage = null;
        }
        await chatData.save();
      }

      res.status(200).json({ msg: "Message deleted successfully" });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },
};
