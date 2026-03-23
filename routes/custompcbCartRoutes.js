const express = require('express')
const router = express.Router()

// ✅ แก้ไขบรรทัดนี้: เปลี่ยนชื่อไฟล์ให้ตรงกับที่คุณมี (custompcbCartContoller.js)
const {
  getCustomCartPCBs,
  getCustomCartPCBById,
  getCustomCartPCBByUserId,
  getCustomCartPCBByaccepted,
  createCustomCartPCB,
  updateCustomCartPCB,
  updateAmountCustomCartPCBById,
  updateStatusCustomCartPCBById,
  updateShippingCustomCartPCBById,
  updatePaymentCustomCartPCBById,
  updateDeliveryCustomCartPCBById,
  deleteCustomCartPCB,
} = require('../controllers/custompcbCartController.js')

// Routes

// 1. Create & Read All
router.post('/', createCustomCartPCB)
router.get('/', getCustomCartPCBs)

// 2. Specific Lists (วางไว้ก่อน /:id)
router.get('/accepted', getCustomCartPCBByaccepted)
router.get('/user/:userId', getCustomCartPCBByUserId)

// 3. Updates
router.put('/amount/:id', updateAmountCustomCartPCBById)
router.put('/status/:id', updateStatusCustomCartPCBById)
router.put('/customshippingrates/:id', updateShippingCustomCartPCBById)
router.put('/paymentrates/:id', updatePaymentCustomCartPCBById)
router.put('/delivered/:id', updateDeliveryCustomCartPCBById)

// 4. Single Item Operations (วางไว้ล่างสุด)
router.get('/:id', getCustomCartPCBById)
router.put('/:id', updateCustomCartPCB)
router.delete('/:id', deleteCustomCartPCB)

module.exports = router