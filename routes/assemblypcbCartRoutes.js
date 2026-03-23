const express = require('express')
const router = express.Router()
const {
  getassemblyCartPCBs,
  getassemblyCartPCBById,
  updateassemblyCartPCB,
  getassemblyCartPCBByUserId,
  getassemblyCartPCBByaccepted,
  createassemblyCartPCB,
  updateAmountassemblyCartPCBById,
  updateStatusassemblyCartPCBById,
  updateShippingassemblyCartPCBById,
  getassemblyCartPCBByDefault,
  updateassemblyCartPCBByDefault,
} = require('../controllers/assemblypcbCartController.js')

// Routes
router.post('/', createassemblyCartPCB)
router.get('/', getassemblyCartPCBs)
router.get('/default', getassemblyCartPCBByDefault)
router.put('/accepted', getassemblyCartPCBByaccepted)
router.put('/default/:id', updateassemblyCartPCBByDefault)
router.get('/user/:userId', getassemblyCartPCBByUserId)
router.put('/amount/:id', updateAmountassemblyCartPCBById)
router.put('/status/:id', updateStatusassemblyCartPCBById)
router.put('/assemblyshippingrates/:id', updateShippingassemblyCartPCBById)
router.get('/:id', getassemblyCartPCBById)
router.put('/:id', updateassemblyCartPCB)
router.delete('/:id', getassemblyCartPCBById)

module.exports = router
