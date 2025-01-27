const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const uploadOnCloudinary = require("../lib/cloudinary");

module.exports = {
  createChat: async function (req, res) {
    try {
      const { users: usersJSON, isGroup, groupName, groupImage } = req.body;
      const users = JSON.parse(usersJSON);

      // Get admin
      const admin = req.user;

      console.log("user: ", req.user);
      console.log("otherUser: ", users[0]);

      // Filterout Redundant userIds
      const userIdList = new Set();

      // Validate userIds And add to the Set
      for (let user of users) {
        const userData = await User.findById(user._id);
        if (user._id == admin._id || !userData) {
          throw new Error("Invalid userIds");
        } else {
          userIdList.add(user._id);
        }
      }
      // Add admin to the userIdlist
      userIdList.add(admin._id);

      // Only group can have groupName, groupImage
      let groupPhoto = "";
      if (isGroup) {
        if (!groupName) {
          throw new Error("Chat can't be created");
        }

        // Upload group Image cloudinary if present
        if (req.file) {
          const response = await uploadOnCloudinary(req.file.path); // multer adds : req.file
          if (!response) throw new Error("Image upload failed on cloudinary");
          groupPhoto = response.url;
        } else {
          groupPhoto =
            "https://cdn-icons-png.flaticon.com/256/2893/2893570.png";
        }
      } else {
        if (groupName || groupImage) {
          throw new Error("Chat can't be created");
        }
      }

      const chat = await Chat.create({
        admin: admin._id,
        userIds: Array.from(userIdList),
        isGroup,
        groupName,
        groupImage: groupPhoto,
      });

      //  Add admin and other users
      const allUsers = [];

      users.forEach((user) => {
        const { _id, name, photoURL } = user;
        allUsers.push({ _id, name, photoURL });
      });

      const { _id, name, photoURL } = admin;
      allUsers.push({ _id, name, photoURL });

      res.status(201).json({
        msg: "Chat created",
        data: { ...chat.toObject(), users: allUsers }, // chat.create() returns addtional metadata and methods
      });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  deleteChat: async function (req, res) {
    try {
      const userId = req.user._id;
      const chatId = req.params.chatId;

      const chatData = await Chat.findById(chatId);
      if (!chatData || !chatData.isGroup || !chatData.admin.equals(userId)) {
        throw new Error("Group can't be deleted");
      }
      await Chat.findByIdAndDelete(chatId);

      res.status(200).json({ msg: "Group deleted successfully" });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  exitChat: async function (req, res) {
    try {
      const reqUserId = req.user._id;
      const chatId = req.params.chatId;

      const chatData = await Chat.findById(chatId);
      if (!chatData.isGroup) throw new Error("Can't exit fromt this chat");

      // Admin is now allowed to exit from a group
      if (reqUserId.equals(chatData.admin)) {
        throw new Error("Admins are not allowed to leave from group");
      }

      // Remove reqUserId from userIds array of the Chat document
      const newChatData = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { userIds: reqUserId },
        },
        { new: true }
      );
      res.status(200).json({ msg: "Successfully exited", data: newChatData });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  getMessages: async function (req, res) {
    try {
      const chatId = req.params.chatId;
      const messages = await Message.find({ chatId }).populate("senderId");

      let messageList = [];
      messages.forEach((message) => {
        const {
          _id,
          senderId: { _id: senderId, name, photoURL },
          attachment,
          content,
          replyTo,
        } = message;

        messageList.push({
          _id,
          name,
          senderId,
          photoURL,
          attachment,
          content,
          replyTo,
        });
      });

      res.status(200).json({ data: messageList });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  toggleBlock: async function (req, res) {
    try {
      const userId = req.user._id;
      const chatId = req.params.chatId;

      const chatData = await Chat.findById(chatId);
      if (!chatData || chatData.isGroup) throw new Error("Invalid chat");

      if (chatData.blockedBy) {
        // block/unblock must be done by same user
        if (chatData.blockedBy.equals(userId)) {
          chatData.blockedBy = null;
        } else {
          throw new Error("Invalid request");
        }
      } else {
        chatData.blockedBy = userId;
      }
      let newChatData = await chatData.save();

      res.status(200).json({
        msg: `${newChatData.blockedBy ? "Blocked" : "Unblocked"} successfully`,
        data: newChatData,
      });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  addUser: async function (req, res) {
    try {
      const reqUserId = req.user._id;
      const chatId = req.params.chatId;
      const users = req.body.users;

      // Check if chat and userIds exists in DB
      const chatData = await Chat.findById(chatId);
      if (!chatData) {
        throw new Error("No chat found");
      }

      for (let user of users) {
        const userData = await User.findById(user._id);

        if (!userData || chatData.admin.equals(user._id)) {
          throw new Error("User not found");
        }
        if (chatData.userIds.includes(user._id)) {
          throw new Error("User already exists");
        }
      }

      if (!chatData.isGroup || !chatData.admin.equals(reqUserId)) {
        throw new Error("User can't be added");
      }

      // Push the the userId into the array of userIds
      const userIdList = users.map((user) => user._id);
      const newChatData = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { userIds: { $each: userIdList } },
        },
        { new: true }
      );

      res
        .status(200)
        .json({ msg: "User added successfully", data: newChatData });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  removeUser: async function (req, res) {
    try {
      const reqUserId = req.user._id;
      const chatId = req.params.chatId;
      const userId = req.body.userId;

      console.log("called");

      const chatData = await Chat.findById(chatId);
      const user = await User.findById(userId);

      if (
        !chatData ||
        !chatData.isGroup ||
        !chatData.admin.equals(reqUserId) ||
        chatData.admin.equals(userId)
      ) {
        throw new Error("User can't be removed");
      }
      if (!user || !chatData.userIds.includes(userId)) {
        throw new Error("User not found");
      }

      // Pull the the userId into the array of userIds
      const newChatData = await Chat.findByIdAndUpdate(chatId, {
        $pull: { userIds: userId },
      });

      res
        .status(200)
        .json({ msg: "User removed successfully", data: newChatData });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  updateChat: async function (req, res) {
    try {
      const chatId = req.params.chatId;
      const chat = await Chat.findById(chatId);

      if (!chat) throw new Error("Chat not found");
      if (!chat.isGroup) throw new Error("Image can't be uploaded");

      const response = await uploadOnCloudinary(req.file.path); // multer adds : req.file
      if (!response) throw new Error("Image upload failed on cloudinary");

      const chatData = await Chat.findByIdAndUpdate(
        chatId,
        {
          groupImage: response.url,
        },
        { new: true }
      );

      res
        .status(200)
        .json({ msg: "Image uploaded successfully", data: chatData });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },
};
