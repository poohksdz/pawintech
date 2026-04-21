const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getSignatures,
  createSignature,
  updateSignature,
  deleteSignature,
} = require("../controllers/signatureController.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Multer config for signature upload
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
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb("อนุญาตเฉพาะไฟล์รูปภาพ (jpg, png, webp)");
    }
  },
});

// Remove white/light backgrounds: trim edges + make near-white pixels transparent
async function removeBackground(imagePath) {
  const outPath = imagePath.replace(/\.([^.]+)$/, "_bg.png");
  const tmpPath = outPath + ".tmp";
  let sourceForPixels = imagePath;

  try {
    // Step 1: Trim uniform edges (Wrap in try-catch because it fails if no uniform background exists)
    try {
      await sharp(imagePath)
        .trim(40)
        .toFile(tmpPath);
      sourceForPixels = tmpPath;
    } catch (_) {
      // Trim failed (maybe complex image), just use original image for background removal
      sourceForPixels = imagePath;
    }

    // Step 2: Remove white/near-white background
    const bgRemovalPromise = sharp(sourceForPixels)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(async ({ data, info }) => {
        const pixels = new Uint8ClampedArray(data);
        for (let i = 0; i < pixels.length; i += 4) {
          // Use luminance for better perception of light/dark
          const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];

          // Backgrounds on mobile photos of paper are often grayish (120-180)
          // We start making it transparent right above 110. Anything above 160 becomes 100% transparent.
          if (lum > 110) {
            const t = Math.min(1, (lum - 110) / (160 - 110));
            // Power curve makes the background drop out faster
            pixels[i + 3] = Math.round((1 - Math.pow(t, 0.7)) * pixels[i + 3]);
          } else {
            // Enhance dark ink (0-110)
            pixels[i + 3] = 255;
          }

          // Gamma correction to make the retained ink much darker and bolder
          if (pixels[i + 3] > 0) {
            pixels[i] = Math.round(Math.pow(pixels[i] / 255, 1.8) * 255);
            pixels[i + 1] = Math.round(Math.pow(pixels[i + 1] / 255, 1.8) * 255);
            pixels[i + 2] = Math.round(Math.pow(pixels[i + 2] / 255, 1.8) * 255);
          }
        }
        await sharp(pixels, {
          raw: { width: info.width, height: info.height, channels: 4 },
        })
          .png()
          .toFile(outPath);
      });

    await bgRemovalPromise;

    // Cleanup temp & original 
    if (sourceForPixels === tmpPath && fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath); // Delete the original upload since we successfully extracted bg
    }

    return outPath;
  } catch (err) {
    // Cleanup any temp files on error
    // We intentionally don't delete imagePath here, so the original file remains if bg removal completely fails
    try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_) { }
    throw err;
  }
}

// UPLOAD ROUTE — must be declared BEFORE /:id route
router.post("/upload", protect, upload.single("signature"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "ไม่มีไฟล์ที่ส่งมา" });

    const fullOrigPath = req.file.path;
    let finalPath = `/uploads/signatures/${req.file.filename}`;

    try {
      const cleanPath = await removeBackground(fullOrigPath);
      finalPath = `/uploads/signatures/${path.basename(cleanPath)}`;
    } catch (bgErr) {
      console.log("Background removal failed, using original:", bgErr.message);
    }

    res.status(201).json({ message: "อัปโหลดลายเซ็นสำเร็จ", image_path: finalPath });
  } catch (err) {
    console.error("Error uploading signature:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปโหลดลายเซ็น" });
  }
});

// CRUD routes
router.route("/").get(protect, getSignatures).post(protect, createSignature);
router.route("/:id").put(protect, updateSignature).delete(protect, deleteSignature);

module.exports = router;
