const express = require('express')
const {
  createStockManufacture,
  updateStockManufacture,
  deleteStockManufacture,
  getStockManufacture,
  getStockManufactureDetails,
} = require('../controllers/stockManufactureController')

const { protect, admin, store } = require('../middleware/authMiddleware.js')

const router = express.Router()

router.route('/').post(protect, createStockManufacture).get(getStockManufacture)
router
  .route('/:id')
  .get(getStockManufactureDetails)
  .delete(protect, deleteStockManufacture)
  .put(protect, updateStockManufacture)

module.exports = router
