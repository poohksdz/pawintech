const express = require('express')
const {
  getStockFootprintByCategory,
  createStockFootprint,
  updateStockFootprint,
  deleteStockFootprint,
  getStockFootprint,
  getStockFootprintDetails,
} = require('../controllers/stockFootprintController.js')

const { protect, admin, store } = require('../middleware/authMiddleware.js')

const router = express.Router()

router.route('/footprintbycategory').get(getStockFootprintByCategory)
router.route('/').post(protect, createStockFootprint).get(getStockFootprint)
router
  .route('/:id')
  .get(getStockFootprintDetails)
  .delete(protect, deleteStockFootprint)
  .put(protect, updateStockFootprint)

module.exports = router
