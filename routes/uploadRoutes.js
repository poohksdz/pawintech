const path = require('path')
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid') // Import UUID

const router = express.Router()

// Utility function to ensure consistent forward slashes in paths
function normalizePath(filePath) {
  // แก้ไขให้ Path เริ่มต้นด้วย /uploads เสมอ และเปลี่ยน \ เป็น /
  return filePath.split(path.sep).join(path.posix.sep)
}

// ✅ ฟังก์ชันช่วยเช็คและสร้างโฟลเดอร์ถ้ายังไม่มี (ป้องกัน Error)
function ensureDirectoryExistence(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
  }
}

// ==========================================
// 1. General Image Upload
// ==========================================
const storageImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/images/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

function imageFileFilter(req, file, cb) {
  const filetypes = /jpe?g|png|webp/
  const mimetypes = /image\/jpe?g|image\/png|image\/webp/

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = mimetypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Images only!'), false)
  }
}

const uploadImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageImages,
  fileFilter: imageFileFilter,
})
const uploadSingleImage = uploadImages.single('image')

router.post('/images', (req, res) => {
  uploadSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    // ส่ง path กลับไปแบบมี /uploads นำหน้า
    res.status(200).send({
      message: 'Image uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 2. Multiple Image Upload
// ==========================================
const createStorage = (folder) =>
  multer.diskStorage({
    destination(req, file, cb) {
      const dir = `uploads/${folder}` // ✅ เก็บใน uploads/
      ensureDirectoryExistence(dir)
      cb(null, dir)
    },
    filename(req, file, cb) {
      const uniqueSuffix = `${Date.now()}-${uuidv4().slice(0, 6)}`
      const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(
        file.originalname
      )}`
      cb(null, filename)
    },
  })

const uploadMultipleImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: createStorage('images/'),
}).array('images', 10)

router.post('/multipleimages', (req, res) => {
  uploadMultipleImages(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).send({ message: 'No images uploaded' })
    }

    res.status(200).send({
      message: 'Multiple images uploaded successfully',
      images: req.files.map((file) => ({
        filename: file.filename,
        path: normalizePath(`/uploads/images/${file.filename}`), // ✅ path
      })),
    })
  })
})

// ==========================================
// 3. Service Image Upload
// ==========================================
const storageServiceImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/serviceImages/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const uploadServiceImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageServiceImages,
  fileFilter: imageFileFilter,
})
const uploadServiceSingleImage = uploadServiceImages.single('image')

router.post('/serviceImages', (req, res) => {
  uploadServiceSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'Service Image uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 4. Showcase Image Upload
// ==========================================
const storageShowcaseImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/showcaseImages/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const uploadShowcaseImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageShowcaseImages, // แก้จาก storageImages เป็น storageShowcaseImages
  fileFilter: imageFileFilter,
})
const uploadShowcaseSingleImage = uploadShowcaseImages.single('image')

router.post('/showcaseImages', (req, res) => {
  uploadShowcaseSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'Showcase Image uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 5. Blog Image Upload
// ==========================================
const storageBlogImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/blogImages/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const uploadBlogImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageBlogImages,
  fileFilter: imageFileFilter,
})
const uploadBlogSingleImage = uploadBlogImages.single('image')

router.post('/blogImages', (req, res) => {
  uploadBlogSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'Blog Image uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 6. Folio Image Upload
// ==========================================
const storageFolioImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/folios/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const uploadFolioImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageFolioImages,
  fileFilter: imageFileFilter,
})
const uploadFolioSingleImage = uploadFolioImages.single('image')

router.post('/folioImages', (req, res) => {
  uploadFolioSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'Folio Image uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 7. CopyPCB Image Upload
// ==========================================
const storageCopyPCBImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/copypcps/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const uploadCopyPCBImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageCopyPCBImages,
  fileFilter: imageFileFilter,
})
const uploadCopyPCBSingleImage = uploadCopyPCBImages.single('image')

router.post('/CopyPCBImages', (req, res) => {
  uploadCopyPCBSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'CopyPCB Image uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 8. Component Image Upload
// ==========================================
const storageComponentImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/componentImages/images/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const uploadComponentImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageComponentImages,
  fileFilter: imageFileFilter,
})
const uploadComponentSingleImage = uploadComponentImages.single('image')

router.post('/componentImages', (req, res) => {
  uploadComponentSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'Component Image uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 9. PaymentSlip Image Upload
// ==========================================
const storagePaymentSlipImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/paymentSlipImages/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const uploadPaymentSlipImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storagePaymentSlipImages,
  fileFilter: imageFileFilter,
})
const uploadPaymentSlipSingleImage = uploadPaymentSlipImages.single('image')

router.post('/paymentSlipImages', (req, res) => {
  uploadPaymentSlipSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'PaymentSlip uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 10. About Image Upload
// ==========================================
const storageAboutImages = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/aboutImages/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

const uploadAboutImages = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageAboutImages,
  fileFilter: imageFileFilter,
})
const uploadAboutSingleImage = uploadAboutImages.single('image')

router.post('/aboutimages', (req, res) => {
  uploadAboutSingleImage(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'About Image uploaded successfully',
      image: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 11. Datasheet Upload (PDF)
// ==========================================
const storageDatasheets = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/datasheets/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

function datasheetFileFilter(req, file, cb) {
  const filetypes = /pdf/
  const mimetypes = /application\/pdf/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = mimetypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Datasheet files only! (PDF format)'), false)
  }
}

const uploadDatasheets = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageDatasheets,
  fileFilter: datasheetFileFilter,
})
const uploadSingleDatasheet = uploadDatasheets.single('datasheet')

router.post('/datasheets', (req, res) => {
  uploadSingleDatasheet(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'Datasheet uploaded successfully',
      datasheet: normalizePath(`/${req.file.path}`),
    })
  })
})

// ==========================================
// 12. Manual Upload (PDF)
// ==========================================
const storageManuals = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/manuals/' // ✅ เก็บใน uploads/
    ensureDirectoryExistence(dir)
    cb(null, dir)
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    )
  },
})

function manualFileFilter(req, file, cb) {
  const filetypes = /pdf/
  const mimetypes = /application\/pdf/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = mimetypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Manual files only! (PDF format)'), false)
  }
}

const uploadManuals = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */
  storage: storageManuals,
  fileFilter: manualFileFilter,
})
const uploadSingleManual = uploadManuals.single('manual')

router.post('/manuals', (req, res) => {
  uploadSingleManual(req, res, function (err) {
    if (err) {
      return res.status(400).send({ message: err.message })
    }
    res.status(200).send({
      message: 'Manual uploaded successfully',
      manual: normalizePath(`/${req.file.path}`),
    })
  })
})

module.exports = router