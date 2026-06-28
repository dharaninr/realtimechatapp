const express = require("express");
const cors = require("cors");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

// Make uploaded files accessible
app.use("/uploads", express.static("uploads"));

// Storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({
    filePath:
      req.protocol +
      "://" +
      req.get("host") +
      "/uploads/" +
      req.file.filename,
  });
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("User Connected");
socket.on("join_room", (data) => {
  socket.join(data.room);

  io.to(data.room).emit(
    "receive_message",
    `${data.username} joined the room`
  );

  console.log(`${data.username} joined ${data.room}`);
});
socket.on("send_message", (data) => {
  console.log("Message received:", data);

  // Private Chat
  if (data.room && data.room.trim() !== "") {
    io.to(data.room).emit(
      "receive_message",
      data.message
    );
  }

  // Public Chat
  else {
    socket.broadcast.emit(
      "receive_message",
      data.message
    );
  }
});
  socket.on("send_file", (file) => {
  console.log("File shared:", file);
  io.emit("receive_file", file);
});
socket.on("leave_room", (data) => {
  socket.leave(data.room);

  io.to(data.room).emit(
    "receive_message",
    `${data.username} left the room`
  );

  console.log(`${data.username} left ${data.room}`);
});
  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

// Home route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Render uses this port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});