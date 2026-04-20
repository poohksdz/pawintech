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
// PDF UPLOAD
// ============================================================================
const uploadPDF = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  /* 20MB Security Limit */ dest: "tempPDF/",
}).single("quotationPDF");

const generateUniquePDFFilename = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `quotation_${timestamp}.pdf`;
};

router.post("/upload-pdf", (req, res) => {
  uploadPDF(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const pdfBuffer = fs.readFileSync(req.file.path);
      const uniqueName = generateUniquePDFFilename();

      const pdfFolder = path.join(
        __dirname,
        "..",
        "quotationimages",
        "quotationpdfs",
      );
      ensureFolder(pdfFolder);

      const targetPath = path.join(pdfFolder, uniqueName);
      fs.writeFileSync(targetPath, pdfBuffer);
      fs.unlinkSync(req.file.path); // cleanup temp file

      return res.status(200).json({
        message: "Quotation PDF uploaded successfully",
        savedAs: uniqueName,
        url: normalizePath(`/quotationimages/quotationpdfs/${uniqueName}`),
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save PDF" });
    }
  });
});

module.exports = router;
