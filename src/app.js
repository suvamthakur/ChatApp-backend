const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const connectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const socketController = require("./controllers/socketController");
const { instrument } = require("@socket.io/admin-ui");
const port = process.env.PORT;

const { createServer } = require("http");
const server = createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: [process.env.ORIGIN, "https://admin.socket.io"],
    credentials: true,
  },
});

// It allows the backend server to specify which origins (domains) can interact with it.
app.use(
  cors({
    origin: [process.env.ORIGIN], // frontend URL
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, this is chat app backend service");
});

app.use("/verify", require("./middlewares/auth"));
app.use("/auth", require("./routes/authRouter"));
app.use("/user", require("./routes/userRouter"));
app.use("/chat", require("./routes/chatRouter"));
app.use("/message", require("./routes/messageRouter"));

// Socket
socketController(io);
// instrument(io, {
//   auth: false,
//   mode: "development",
// });

connectDB()
  .then(() => {
    console.log("Database connection established");
    server.listen(port, () => {
      console.log(`Server is listening on ${port}`);
    });
  })
  .catch((err) => {
    console.log("Database cannot be connected");
  });
