const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "uploads", "signatures");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `sig_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb("อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, webp)");
    }
  },
});

// Auto-crop transparent/white borders using Canvas
async function cropSignature(imagePath) {
  return new Promise((resolve, reject) => {
    const ext = path.extname(imagePath).toLowerCase();
    const isPNG = ext === '.png';
    // Use sharp if available, otherwise return original
    const sharp = require.cache[require.resolve('sharp')] || null;
    if (!sharp) {
      try {
        require('sharp');
      } catch (e) {
        // sharp not installed, return original
        resolve(imagePath);
        return;
      }
    }
    try {
      const sharpFn = require('sharp');
      const output = imagePath.replace(/\.([^.]+)$/, '_cropped.png');

      sharpFn(imagePath)
        .trim(30) // trim background with 30 tolerance
        .toFile(output)
        .then(() => {
          // Replace original with cropped
          fs.unlinkSync(imagePath);
          const croppedPath = output;
          resolve(croppedPath);
        })
        .catch(() => resolve(imagePath)); // fallback to original
    } catch (e) {
      resolve(imagePath);
    }
  });
}

router.post("/", protect, upload.single("signature"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "ไม่มีไฟล์ที่ส่งมา" });

    // Auto-crop white/transparent borders (only for PNG)
    let finalPath = `/uploads/signatures/${req.file.filename}`;
    const fullOrigPath = req.file.path;
    const ext = path.extname(fullOrigPath).toLowerCase();
    if (ext === ".png") {
      const croppedPath = await cropSignature(fullOrigPath);
      if (croppedPath !== fullOrigPath) {
        const croppedFile = path.basename(croppedPath);
        finalPath = `/uploads/signatures/${croppedFile}`;
      }
    }

    res.status(201).json({ message: "อัปโหลดลายเซ็นสำเร็จ", image_path: finalPath });
  } catch (err) {
    console.error("Error uploading signature:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น" });
  }
});

module.exports = router;
