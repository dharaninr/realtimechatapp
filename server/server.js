const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

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

// Home route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Render uses this port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});