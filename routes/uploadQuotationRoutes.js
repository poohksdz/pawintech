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

// ============================================================================
// IMAGE UPLOAD
// ============================================================================
const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = path.join(
      __dirname,
      "..",
      "quotationimages",
      "quotationimages",
    );
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

const fileFilter = (req, file, cb) => {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error("Only images (jpg/jpeg/png/webp) allowed!"));
};

const uploadImage = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  /* 20MB Security Limit */ storage: imageStorage,
  fileFilter,
});

router.post("/upload-image", uploadImage.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const type = path.basename(req.body.type || "other");
  const baseFolder = path.join(
    __dirname,
    "..",
    "quotationimages",
    "quotationimages",
  );
  const typeFolder = path.join(baseFolder, type);
  ensureFolder(typeFolder);

  const oldPath = req.file.path;
  const newPath = path.join(typeFolder, req.file.filename);
  fs.renameSync(oldPath, newPath);

  res.status(200).json({
    message: "Image uploaded successfully",
    url: normalizePath(
      `/quotationimages/quotationimages/${type}/${req.file.filename}`,
    ),
  });
});

// ============================================================================
// PDF UPLOAD via Base64 JSON (no multer needed)
// ============================================================================
const generateUniquePDFFilename = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `quotation_${timestamp}.pdf`;
};

router.post("/upload-pdf", (req, res) => {
  try {
    const { pdfBase64, filename } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "No PDF data provided (pdfBase64 is missing)" });
    }

    // Decode base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const uniqueName = generateUniquePDFFilename();

    const pdfFolder = path.join(__dirname, "..", "quotationimages", "quotationpdfs");
    ensureFolder(pdfFolder);

    const targetPath = path.join(pdfFolder, uniqueName);
    fs.writeFileSync(targetPath, pdfBuffer);

    console.log(`✅ Quotation PDF saved: ${uniqueName} (${pdfBuffer.length} bytes)`);

    return res.status(200).json({
      message: "Quotation PDF uploaded successfully",
      savedAs: uniqueName,
      url: normalizePath(`/quotationimages/quotationpdfs/${uniqueName}`),
    });
  } catch (error) {
    console.error("❌ PDF save error:", error);
    return res.status(500).json({ error: "Failed to save PDF: " + error.message });
  }
});

module.exports = router;
