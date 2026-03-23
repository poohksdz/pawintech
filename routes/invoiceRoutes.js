const express = require('express')
const router = express.Router()
const {
  getInvoices,
  getInvoiceDetails,
  getInvoicesByUserId,
  getInvoicesByInvoiceId,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  deleteInvoiceByInvoiceId,
} = require('../controllers/invoiceProductController.js')
const multer = require('multer')

// Configure multer for image uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/') // folder to save uploaded images
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname)
//   },
// })
// const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 }, /* 20MB Security Limit */ storage })

// Routes
router.get('/', getInvoices)
router.get('/invoice/:invoiceId', getInvoicesByInvoiceId)
router.get('/user/:userId', getInvoicesByUserId)
router.get('/:id', getInvoiceDetails)
router.post('/', createInvoice)
router.put('/:id', updateInvoice)
router.delete('/invoice_id/:id', deleteInvoiceByInvoiceId)
router.delete('/:id', deleteInvoice)

module.exports = router
