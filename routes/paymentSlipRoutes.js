const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/authMiddleware.js");

// Configure multer storage for payment slip images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "paymentSlipImages/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "slip-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("รองรับเฉพาะไฟล์รูปภาพ (jpeg, jpg, png, gif, webp)"));
    },
});

const { uploadPaymentSlipImage } = require("../controllers/paymentSlipController.js");

// POST /api/paymentSlipImages - Upload payment slip image
router.route("/").post(protect, upload.single("image"), uploadPaymentSlipImage);

module.exports = router;
