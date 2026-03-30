const express = require('express')
const router = express.Router()
const {
    getOrderPCBCarts,
    getOrderPCBCartById,
    getOrderPCBCartByUserId,
    createOrderPCBCart,
    updateOrderPCBCartStatus,
    deleteOrderPCBCart
} = require('../controllers/orderPCBCartController')
const { protect, admin } = require('../middleware/authMiddleware')

router.route('/')
    .get(protect, admin, getOrderPCBCarts)
    .post(protect, createOrderPCBCart)

router.route('/:id')
    .get(protect, getOrderPCBCartById)
    .delete(protect, deleteOrderPCBCart)

router.route('/:id/status')
    .put(protect, admin, updateOrderPCBCartStatus)

router.route('/user/:userId')
    .get(protect, getOrderPCBCartByUserId)

module.exports = router
