const express = require("express");
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

const generateUniquePDFFilename = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate(),
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `invoice_${timestamp}.pdf`;
};

// ============================================================================
// PDF UPLOAD via Base64 JSON (no multer needed)
// ============================================================================
router.post("/upload-pdf", (req, res) => {
  try {
    const { pdfBase64, filename } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: "No PDF data provided (pdfBase64 is missing)" });
    }

    // Decode base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const uniqueName = generateUniquePDFFilename();

    const pdfFolder = path.join(__dirname, "..", "uploads", "invoicepdfs");
    ensureFolder(pdfFolder);

    const targetPath = path.join(pdfFolder, uniqueName);
    fs.writeFileSync(targetPath, pdfBuffer);

    console.log(`✅ Invoice PDF saved: ${uniqueName} (${pdfBuffer.length} bytes)`);

    return res.status(200).json({
      message: "Invoice PDF uploaded successfully",
      savedAs: uniqueName,
      url: normalizePath(`/uploads/invoicepdfs/${uniqueName}`),
    });
  } catch (error) {
    console.error("❌ PDF save error:", error);
    return res.status(500).json({ error: "Failed to save PDF: " + error.message });
  }
});

module.exports = router;
