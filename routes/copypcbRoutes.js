const express = require('express')
const router = express.Router()
const {
  createcopyPCB,
  getcopyPCBById,
  getcopyPCBs,
  getcopyPCBByUserId,
  updatecopyPCBById,
  updateDeliverycopyPCBById,
  deletecopyPCB,
  createcopyPCBbyAdmin,
  getcopyPCBByOrderId,
} = require('../controllers/copypcbcontroller.js')

// ==========================
// Routes
// ==========================

// Create
router.post('/', createcopyPCB)
router.post('/createcopypcbbyadmin', createcopyPCBbyAdmin)

// Get all
router.get('/', getcopyPCBs)

// Get by user
router.get('/user/:userId', getcopyPCBByUserId)

// Get by orderID (ทำให้เหมือน custompcb)
router.get('/byorderid/:orderID', getcopyPCBByOrderId)

// Update order
router.put('/:id', updatecopyPCBById)

// 🔥 ทำให้เหมือน custompcb
router.put('/delivery/:id', updateDeliverycopyPCBById)

// Get by ID (ต้องอยู่ล่างสุดของ GET dynamic)
router.get('/:id', getcopyPCBById)

// Delete
router.delete('/:id', deletecopyPCB)

module.exports = router
