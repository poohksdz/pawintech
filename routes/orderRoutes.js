const express = require('express')
const router = express.Router()

const {
  addOrderItems,
  getOrders,
  getOrderById,
  getMyOrders,
  updateOrderToReceivePlace,
  updateOrderToPaid, // ✅ ต้องใช้ตัวนี้สำหรับปุ่ม Verify
  updateOrderToDelivered,
  updateTransportationPrice,
  getTransportationPrice,
  getAllUnifiedOrders,
} = require('../controllers/orderController.js')

const { protect, admin, store } = require('../middleware/authMiddleware.js')

// 1. เส้นทางหลัก
router.route('/')
  .post(protect, addOrderItems)
  .get(protect, store, getOrders)

// 2. เส้นทางเฉพาะ (ต้องมาก่อน /:id)
router.route('/mine').get(protect, getMyOrders)
router.route('/all-types').get(protect, store, getAllUnifiedOrders) // ✅ Added: Single Unified API

// เส้นทางจัดการค่าส่ง
router.route('/:id/gettransportationprice').get(getTransportationPrice)
router.route('/:id/updatetransportationprice').put(protect, store, updateTransportationPrice)

// 3. เส้นทางจัดการ Order ตาม ID
router.route('/:id').get(protect, getOrderById)

// ✅✅✅ แก้ไข: เปิดใช้งาน Route นี้ (เอา // ออก) ✅✅✅
router.route('/:id/pay').put(protect, updateOrderToPaid)
// ----------------------------------------------------

router.route('/:id/receiveplace').put(protect, updateOrderToReceivePlace)
router.route('/:id/deliver').put(protect, store, updateOrderToDelivered)

module.exports = router