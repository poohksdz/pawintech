const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  dest: "uploads/",
});

// Helper: generate unique name like "gerber_20250701163233.zip"
const generateUniqueFilename = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());

  return `gerber_${timestamp}.zip`;
};

// Whitelist of allowed characters in filename (alphanumeric, dash, underscore, dot, hyphen)
const VALID_FILENAME = /^[a-zA-Z0-9._-]+\.zip$/;

router.get("/download/:filename", protect, (req, res) => {
  let filename = req.params.filename;

  // Security: Reject dangerous patterns (path traversal, special chars)
  if (!VALID_FILENAME.test(filename)) {
    console.warn(`[Gerber] Invalid filename pattern: ${filename}`);
    return res.status(400).json({ error: "Invalid filename" });
  }

  // Strip prefixes if they were accidentally passed in the URL
  filename = filename.replace(/^gerbers[\/\\]/, "");

  const gerbersDir = path.resolve(__dirname, "..", "gerbers");
  const filePath = path.join(gerbersDir, filename);

  // Security: Ensure resolved path is within gerbers directory
  if (!filePath.startsWith(gerbersDir)) {
    console.warn(`[Gerber] Path traversal attempt: ${req.params.filename}`);
    return res.status(403).json({ error: "Access denied" });
  }

  console.log(
    `[Gerber] Attempting download: ${filename} (Full path: ${filePath})`,
  );

  if (fs.existsSync(filePath)) {
    console.log(`[Gerber] File found. Sending...`);
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(
          `[Gerber] Error during file transmission for ${filename}:`,
          err,
        );
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to transmit file" });
        }
      }
    });
  } else {
    console.warn(`[Gerber] File NOT FOUND: ${filename} at ${filePath}`);
    res.status(404).json({ error: "File not found on server" });
  }
});

router.post("/upload-zip", protect, upload.single("gerberZip"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Only accept .zip files
    const originalExt = path.extname(req.file.originalname).toLowerCase();
    if (originalExt !== ".zip") {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Only ZIP files are allowed" });
    }

    const zipBuffer = fs.readFileSync(req.file.path);

    // Always generate a unique name regardless of uploaded file name
    const uniqueZipName = generateUniqueFilename();
    const targetPath = path.join(__dirname, "..", "gerbers", uniqueZipName);

    // Ensure "gerbers" folder exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    fs.writeFileSync(targetPath, zipBuffer);

    return res.json({
      message: "ZIP uploaded and saved successfully",
      savedAs: uniqueZipName,
      path: `gerbers/${uniqueZipName}`,
    });
  } catch (err) {
    console.error("Error saving ZIP:", err);
    return res.status(500).json({ error: "Failed to save ZIP" });
  } finally {
    // Clean up temp file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

module.exports = router;
