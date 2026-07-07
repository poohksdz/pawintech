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
// PDF UPLOAD
// ============================================================================
const uploadPDF = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  /* 20MB Security Limit */ dest: "tempPDF/",
}).single("invoicePDF");

const generateUniquePDFFilename = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `invoice_${timestamp}.pdf`;
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
        "uploads",
        "invoicepdfs",
      );
      ensureFolder(pdfFolder);

      const targetPath = path.join(pdfFolder, uniqueName);
      fs.writeFileSync(targetPath, pdfBuffer);
      fs.unlinkSync(req.file.path); // cleanup temp file

      return res.status(200).json({
        message: "Invoice PDF uploaded successfully",
        savedAs: uniqueName,
        url: normalizePath(`/uploads/invoicepdfs/${uniqueName}`),
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to save PDF" });
    }
  });
});

module.exports = router;
