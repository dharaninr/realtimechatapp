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

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Multer storage settings
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

  // Join Room
  socket.on("join_room", (data) => {
    socket.join(data.room);

    io.to(data.room).emit("receive_message", {
      message: `${data.username} joined the room`,
      room: data.room,
    });

    console.log(`${data.username} joined ${data.room}`);
  });

  // Send Message
  socket.on("send_message", (data) => {
    console.log("Message received:", data);

    // Private room
    if (data.room && data.room.trim() !== "") {
      io.to(data.room).emit("receive_message", {
        message: data.message,
        room: data.room,
      });
    }

    // Public chat
    else {
      io.emit("receive_message", {
        message: data.message,
        room: "",
      });
    }
  });

  // Send File
  socket.on("send_file", (data) => {
    console.log("File shared:", data);

    // Private room
    if (data.room && data.room.trim() !== "") {
      io.to(data.room).emit("receive_file", {
        file: data.file,
        room: data.room,
      });
    }

    // Public chat
    else {
      io.emit("receive_file", {
        file: data.file,
        room: "",
      });
    }
  });

  // Leave Room
  socket.on("leave_room", (data) => {
    io.to(data.room).emit("receive_message", {
      message: `${data.username} left the room`,
      room: data.room,
    });

    socket.leave(data.room);

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

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});