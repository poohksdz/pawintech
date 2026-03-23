const express = require('express')
const {
  createStockIssuegoods,
  updateStockIssuegoods,
  deleteStockIssuegoods,
  getStockIssuegoods,
  getStockIssuegoodsDetails,
  getStockIssuegoodsUser,
} = require('../controllers/stockIssueController')

const { protect, admin, store } = require('../middleware/authMiddleware.js')

const router = express.Router()

router.route('/').post(protect, createStockIssuegoods).get(getStockIssuegoods)
router
  .route('/:id')
  .get(getStockIssuegoodsDetails)
  .delete(protect, deleteStockIssuegoods)
  .put(protect, updateStockIssuegoods)
router.route('/user/:id').get(getStockIssuegoodsUser)

module.exports = router
