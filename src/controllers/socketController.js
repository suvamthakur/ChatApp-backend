const { getUserChats } = require("./userController");

const socketController = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    const userChats = await getUserChats({ user: { _id: userId } }, null);

    userChats.forEach((chat) => {
      socket.join(chat._id.toString());
    });
    socket.join(userId.toString()); // In future we can get this user's socket because of this room

    // New chat created
    socket.on("create_chat", (chatData, users) => {
      // Join admin to the room (chatId)
      let chatId = chatData._id.toString();
      socket.join(chatId);

      // Join all users to the room (chatId)
      users.forEach((user) => {
        let userId = user._id.toString();

        io.to(userId).socketsJoin(chatId);
        io.to(userId).emit("chat_created", chatData);
      });
    });

    // Add new users to a chat(group)
    socket.on("add_user_to_group", (chatId, newUsers) => {
      // Notify all the existing users of this chat room
      let chat_id = chatId.toString();
      io.to(chat_id).emit("new_user_added", chatId, newUsers);

      newUsers.forEach((user) => {
        let userId = user._id.toString();

        io.to(userId).socketsJoin(chat_id); // add all user sockets to `chatId` room
        io.to(userId).emit("new_user_added", chatId, newUsers);
      });
    });

    // Remove user from a group
    socket.on("remove_user", (chatId, removedUserId) => {
      const chat_id = chatId.toString();
      io.to(chat_id).emit("user_removed", chatId, removedUserId);
    });

    // Block user
    socket.on("block_user", (blockedBy, chatId) => {
      const chat_id = chatId.toString();
      io.to(chat_id).emit("user_blocked", blockedBy, chatId);
    });

    socket.on("exit_group", (chatId, userId) => {
      const chat_id = chatId.toString();
      io.to(chat_id).emit("user_removed", chatId, userId);
    });

    // Unblock user
    socket.on("unblock_user", (chatId) => {
      const chat_id = chatId.toString();
      io.to(chat_id).emit("user_unblocked", chatId);
    });

    socket.on("delete_group", (chatId) => {
      const chat_id = chatId.toString();
      io.to(chat_id).emit("group_deleted", chatId);
    });

    // User profile image update
    socket.on("profile_update", async (userData) => {
      const userChats = await getUserChats(
        { user: { _id: userData._id } },
        null
      );

      userChats.forEach((chat) => {
        const chatId = chat._id.toString();
        io.to(chatId).emit("profile_updated", userData);
      });
    });

    // Chat image update
    socket.on("update_chat", async (chatData) => {
      const chatId = chatData._id.toString();
      io.to(chatId).emit("chat_updated", chatData);
    });

    // New Message
    socket.on("new_message", (message) => {
      const chatId = message.chatId.toString();
      io.to(chatId).emit("new-message", message);
    });

    socket.on("delete_message", (messageId, chatId) => {
      const chat_id = chatId.toString();
      io.to(chat_id).emit("message_deleted", messageId, chatId);
    });

    socket.on("disconnect", () => {
      userChats.forEach((chat) => {
        socket.leave(chat._id.toString());
      });
      socket.leave(userId);
    });
  });
};

module.exports = socketController;
