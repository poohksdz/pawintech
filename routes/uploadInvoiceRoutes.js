const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware.js");

const router = express.Router();
router.use(protect);

const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
};

// ============================================================================
// PDF UPLOAD via Multer (multipart/form-data)
// ============================================================================
const pdfStorage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = path.join(__dirname, "..", "uploads", "invoicepdfs");
    ensureFolder(folder);
    cb(null, folder);
  },
  filename(req, file, cb) {
    const pad = (n) => n.toString().padStart(2, "0");
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate(),
    )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    cb(null, `invoice_${timestamp}.pdf`);
  },
});

const uploadPdfMulter = multer({
  storage: pdfStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.post("/upload-pdf", uploadPdfMulter.single("invoice_pdf"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file provided" });
  }
  const url = `/uploads/invoicepdfs/${req.file.filename}`;
  res.status(200).json({
    message: "PDF uploaded successfully",
    url: url,
  });
});

module.exports = router;
