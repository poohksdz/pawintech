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
    const folder = "assemblypcbImages/";
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
      image: normalizePath(`/assemblypcbImages/${req.file.filename}`),
    });
  });
});

////////////////////////////////////////////////////////////////////////////////
// MULTIPLE IMAGE UPLOAD => /upload/multipleimages
////////////////////////////////////////////////////////////////////////////////

const multipleImageStorage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = "assemblypcbImages/";
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
      path: normalizePath(`/assemblypcbImages/${file.filename}`),
    }));

    return res.status(200).json({
      message: "Multiple images uploaded successfully",
      images: paths,
    });
  });
});

////////////////////////////////////////////////////////////////////////////////
// ZIP or RAR UPLOAD => /uploadgerber-zip
////////////////////////////////////////////////////////////////////////////////

const archiveFilter = (req, file, cb) => {
  const allowedExt = /\.(zip|rar)$/i;
  const allowedMime = /(application\/zip|application\/x-rar-compressed)/i;

  const extOK = allowedExt.test(path.extname(file.originalname));
  const mimeOK = allowedMime.test(file.mimetype);

  if (extOK || mimeOK) {
    cb(null, true);
  } else {
    cb(new Error("Only ZIP or RAR files are allowed!"), false);
  }
};

const uploadArchive = multer({
  limits: { fileSize: 20 * 1024 * 1024 } /* 20MB Security Limit */,
  dest: "tempZip/",
  fileFilter: archiveFilter,
}).single("gerberZip");

const generateUniqueArchiveFilename = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `gerber_${timestamp}`;
};

router.post("/uploadgerber-zip", (req, res) => {
  //  Name stays same!
  uploadArchive(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // KEEP real extension (zip or rar)
      const ext = path.extname(req.file.originalname).toLowerCase();
      const uniqueName = `${generateUniqueArchiveFilename()}${ext}`;

      const saveFolder = path.join(__dirname, "..", "assemblypcbZipFiles");
      ensureFolder(saveFolder);

      const targetPath = path.join(saveFolder, uniqueName);

      //  Use copyFileSync for better performance and lower memory usage
      fs.copyFileSync(req.file.path, targetPath);
      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        message: "Archive uploaded successfully",
        savedAs: uniqueName,
        path: normalizePath(`/assemblypcbZipFiles/${uniqueName}`),
      });
    } catch (error) {
      console.error("Upload Error:", error);
      return res.status(500).json({ error: "Failed to save archive" });
    }
  });
});

module.exports = router;
