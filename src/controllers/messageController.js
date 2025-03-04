const uploadOnCloudinary = require("../lib/cloudinary");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Bot = require("../models/Bot");
const model = require("../lib/gemini");

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
        if (!messageData.senderId.equals(userId) && !chatData.isBot) {
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

  getAIresponse: async function (req, res) {
    try {
      const content = req.body.content;
      const chatId = req.params.chatId;

      const prompt = `Role: You are a helpful chatbot within a chat application. 
            - Your name is Agent
            - Name of the developer pf this chat application is Suvam Thakur
            
            1.  Respond to user messages in a conversational and friendly manner.
            2.  If the user asks a question, provide a concise and accurate answer.
            3.  If you don't know the answer or the query is irrelevant, respond with "I'm sorry, I don't understand" or "I'm not able to help with that."
            4. If the user makes a statement, acknowledge it appropriately.
            5. Keep your responses short and to the point.
            6. If given previous conversation, consider it when creating your response.

            User Message: ${content}

            Response:`;
      const result = await model.generateContent(prompt);
      const msg = result.response.text();

      const bot = await Bot.findOne({});

      const message = await Message.create({
        senderId: bot._id,
        chatId: chatId,
        senderName: bot.name,
        content: msg,
      });

      res.status(200).json({ data: message });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },
};
