const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();
router.use(protect);

// Ensure folder exists
const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
};

// Normalize slashes for URLs
const normalizePath = (filePath) =>
  filePath.split(path.sep).join(path.posix.sep);

// Multer storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = "defaultquotationimages/";
    ensureFolder(folder);
    cb(null, folder);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only images (jpg/jpeg/png/webp) allowed!"));
};

const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  /* 20MB Security Limit */ storage,
  fileFilter,
});

// Single image upload
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const type = req.body.type || "other";
  const oldPath = req.file.path;
  const newFolder = path.join("defaultquotationimages", type);
  ensureFolder(newFolder);
  const newPath = path.join(newFolder, req.file.filename);
  fs.renameSync(oldPath, newPath);

  res.status(200).json({
    message: "Image uploaded successfully",
    url: normalizePath(`/defaultquotationimages/${type}/${req.file.filename}`),
  });
});

module.exports = router;
