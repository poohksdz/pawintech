const express = require('express')
const router = express.Router()
const { getPayments, updatePaymentStatus } = require('../controllers/paymentController.js')
const { protect, admin } = require('../middleware/authMiddleware.js')

// เส้นทางสำหรับดึงรายการชำระเงินทั้งหมด (ต้องเป็น Admin เท่านั้น)
router.route('/').get(protect, admin, getPayments)

// เส้นทางสำหรับอัปเดตสถานะการชำระเงิน (ต้องเป็น Admin เท่านั้น)
router.route('/:id').put(protect, admin, updatePaymentStatus)

module.exports = router