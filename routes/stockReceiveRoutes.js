const express = require('express')
const {
  createStockGoodsreceipt,
  updateStockGoodsreceipt,
  deleteStockGoodsreceipt,
  getStockGoodsreceipt,
  getStockGoodsreceiptDetails,
} = require('../controllers/stockReceiveController')

const { protect, admin } = require('../middleware/authMiddleware.js')

const router = express.Router()

router
  .route('/')
  .post(protect, createStockGoodsreceipt)
  .get(getStockGoodsreceipt)
router
  .route('/:id')
  .get(getStockGoodsreceiptDetails)
  .delete(protect, deleteStockGoodsreceipt)
  .put(protect, updateStockGoodsreceipt)

module.exports = router
