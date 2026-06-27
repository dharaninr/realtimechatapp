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
      "http://localhost:5000/uploads/" +
      req.file.filename,
  });
});

// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
