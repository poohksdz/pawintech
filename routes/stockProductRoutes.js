const express = require('express')
const router = express.Router()

const {
  getStockProducts,
  getStockProductById,
  createStockProduct,
  updateStockProduct,
  deleteStockProduct,
  updateStockProductQty,
  updateStockProductQtyByElectotronixPN,
  toggleStarProduct,
} = require('../controllers/stockProductController.js')

const { protect, admin, store } = require('../middleware/authMiddleware.js')

router.route('/').get(protect, getStockProducts).post(protect, createStockProduct)

router
  .route('/:id')
  .get(protect, getStockProductById)
  .put(protect, updateStockProduct)
  .delete(protect, deleteStockProduct)

router
  .route('/updateProductQtyByElectotronixPN/:electotronixPN')
  .put(protect, updateStockProductQtyByElectotronixPN)

router
  .route('/:id/star')
  .put(protect, toggleStarProduct)

module.exports = router
