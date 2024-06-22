const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const app = express();
const port = 4000;

// Enable CORS for all routes
app.use(cors());

// Create the uploads directory if it doesn't exist
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  },
});

// File filter to accept only video files based on extension
const fileFilter = (req, file, cb) => {
  // Allowed video file extensions
  const allowedExtensions = [".mp4", ".mkv", ".webm", ".ogg"];

  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only video files are allowed."));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// Rate limit for serving video files
const videoRateLimitSegments = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 600, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

// Rate limit for serving video files
const videoRateLimitMpd = rateLimit({
  windowMs: 1 * 60 * 1000, // 10 minutes
  max: 6, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});

// Serve the DASH manifest file with rate limiting
app.get("/video.mpd", videoRateLimitMpd, (req, res) => {
  console.log("called for mpd");
  const filePath = path.join(__dirname, "video", "video.mpd");
  res.sendFile(filePath);
});

// Serve the DASH segment files with rate limiting
app.get("/video/:segment", videoRateLimitSegments, (req, res) => {
  console.log("called segment");
  const segment = req.params.segment;
  const filePath = path.join(__dirname, "video", segment);
  res.sendFile(filePath);
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  res.status(201).json({ message: "File uploaded successfully" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
