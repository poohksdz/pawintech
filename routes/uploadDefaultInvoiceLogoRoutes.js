const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router()

// Ensure directory exists
const ensureFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
}

const normalizePath = (filePath) =>
  filePath.split(path.sep).join(path.posix.sep)

// Storage for invoice logos
const invoiceLogoStorage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = 'images/'
    ensureFolder(folder)
    cb(null, folder)
  },
  filename(req, file, cb) {
    const uniqueName = `invoiceLogo-${Date.now()}${path.extname(
      file.originalname
    )}`
    cb(null, uniqueName)
  },
})

const imageFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|webp/
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = mimetypes.test(file.mimetype)
  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP) are allowed!'), false)
  }
}

const uploadInvoiceLogo = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: invoiceLogoStorage,
  fileFilter: imageFilter,
}).single('image')

// POST /api/defaultInvoiceImages
router.post('/', (req, res) => {
  uploadInvoiceLogo(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: err.message })
    }

    return res.status(200).json({
      message: 'Invoice logo uploaded successfully',
      image: normalizePath(`/${req.file.filename}`),
    })
  })
})

module.exports = router
