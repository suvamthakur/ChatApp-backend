const Chat = require("../models/Chat");
const User = require("../models/User");
const uploadOnCloudinary = require("../lib/cloudinary");

module.exports = {
  getProfile: async function (req, res) {
    try {
      const user = req.user.toObject();
      delete user.password;

      if (user) {
        return res.status(200).json({ data: user });
      } else {
        throw new Error("User not found");
      }
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  getAllProfiles: async function (req, res) {
    try {
      const userId = req.user._id;

      // Get all profile except the user who requested
      const allUsers = await User.find({ _id: { $ne: userId } }).select(
        "-email -password"
      );

      res.status(200).json({ data: allUsers });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  getUserChats: async function (req, res) {
    try {
      const userId = req.user._id;

      const chats = await Chat.find({
        userIds: { $in: [userId] },
      })
        .populate("userIds lastMessage")
        .select("-userIds");

      let chatList = [];
      for (let chat of chats) {
        let { userIds, lastMessage } = chat;

        const users = [];
        userIds.forEach((user) => {
          const { _id, name, photoURL } = user;
          users.push({ _id, name, photoURL });
        });

        // Fetch the name of sender of lastMessage
        const sender = await User.findById(lastMessage?.senderId);

        const chatData = chat.toObject(); // to get plain object
        delete chatData.userIds;

        chatList.push({
          ...chatData,
          users,
          lastMessage: {
            _id: lastMessage?._id,
            senderName: sender?.name,
            content: lastMessage?.content,
            attachmentUrl: lastMessage?.attachment?.url,
          },
        });
      }

      if (res) {
        res.status(200).json({ data: chatList });
      } else {
        return chatList;
      }
    } catch (err) {
      if (res) {
        res.status(400).json({ msg: err.message });
      } else {
        throw new Error(err.message);
      }
    }
  },

  updateProfile: async function (req, res) {
    try {
      const userId = req.user._id;
      const response = await uploadOnCloudinary(req.file.path); // multer adds : req.file

      if (!response) throw new Error("Image upload failed on cloudinary");

      const userData = await User.findByIdAndUpdate(
        userId,
        {
          photoURL: response.url,
        },
        { new: true }
      ).select("-password");

      res
        .status(200)
        .json({ msg: "Image uploaded successfully", data: userData });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },
};
