const express = require('express')
const router = express.Router()
const {
  getQuotations,
  getQuotationById,
  getQuotationByQuotationNo,
  getQuotationUsed,
  createQuotation,
  updateQuotation,
  updateQuotationByQuotationNo,
  deleteQuotation,
  deleteQuotationByQuotationNo,
} = require('../controllers/quotationController.js')

const { protect, admin, store } = require('../middleware/authMiddleware.js')

// Get all quotations
router.get('/', getQuotations)

// Get single quotation by ID
router.get('/:id', getQuotationById)

// Get single quotation by ID
router.get('/quotation_no/:id', getQuotationByQuotationNo)

// Get used quotations
router.get('/used', getQuotationUsed)

// Create a new quotation
router.post('/', protect, createQuotation)

// Update a quotation
router.put('/:id', protect, updateQuotation)

// Update a quotation by quotation no
router.put('/quotation_no/:id', protect, updateQuotationByQuotationNo)

// Delete a quotation
router.delete('/:id', protect, deleteQuotation)

// Delete a quotation by quotation no
router.delete('/quotation_no/:id', protect, deleteQuotationByQuotationNo)

module.exports = router
