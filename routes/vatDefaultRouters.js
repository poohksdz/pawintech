const express = require('express')
const router = express.Router()

const {
  getDefaultInvoices,
  getDefaultInvoiceById,
  getDefaultInvoiceUsed,
  createDefaultInvoice,
  updateDefaultInvoice,
  useDefaultInvoice,
  deleteDefaultInvoice,
} = require('../controllers/vatDefaultController.js')

const { protect, admin } = require('../middleware/authMiddleware.js')

router.route('/used').get(getDefaultInvoiceUsed)
router.route('/').get(getDefaultInvoices).post(createDefaultInvoice)
router.route('/:id/use').put(useDefaultInvoice)
router
  .route('/:id')
  .get(getDefaultInvoiceById)
  .put(updateDefaultInvoice)
  .delete(deleteDefaultInvoice)

module.exports = router
