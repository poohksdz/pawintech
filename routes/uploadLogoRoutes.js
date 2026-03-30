import React from "react";

const uploadLogoRoutes = () => {
  return <div>uploadLogoRoutes</div>;
};

export default uploadLogoRoutes;

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Ensure directory exists
const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// Normalize slashes for URLs
const normalizePath = (filePath) =>
  filePath.split(path.sep).join(path.posix.sep);

////////////////////////////////////////////////////////////////////////////////
// SINGLE IMAGE UPLOAD => /upload/images
////////////////////////////////////////////////////////////////////////////////

const singleImageStorage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = "images/";
    ensureFolder(folder);
    cb(null, folder);
  },
  filename(req, file, cb) {
    const uniqueName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/;
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = mimetypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, WEBP) are allowed!"), false);
  }
};

const uploadSingleImage = multer({
  limits: { fileSize: 20 * 1024 * 1024 } /* 20MB Security Limit */,
  storage: singleImageStorage,
  fileFilter: imageFilter,
}).single("image");

router.post("/images", (req, res) => {
  uploadSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(200).json({
      message: "Image uploaded successfully",
      image: normalizePath(`/${req.file.filename}`),
    });
  });
});

////////////////////////////////////////////////////////////////////////////////
// MULTIPLE IMAGE UPLOAD => /upload/multipleimages
////////////////////////////////////////////////////////////////////////////////

const multipleImageStorage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = "custompcbImages/";
    ensureFolder(folder);
    cb(null, folder);
  },
  filename(req, file, cb) {
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.floor(Math.random() * 10000)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const uploadMultipleImages = multer({
  limits: { fileSize: 20 * 1024 * 1024 } /* 20MB Security Limit */,
  storage: multipleImageStorage,
  fileFilter: imageFilter,
}).array("images", 10); // max 10 images

router.post("/multipleimages", (req, res) => {
  uploadMultipleImages(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const paths = req.files.map((file) => ({
      filename: file.filename,
      path: normalizePath(`/${file.filename}`),
    }));

    return res.status(200).json({
      message: "Multiple images uploaded successfully",
      images: paths,
    });
  });
});

module.exports = router;
