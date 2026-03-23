const express = require('express')
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createTestNotification,
    deleteNotification,
    deleteAllNotifications,
} = require('../controllers/notificationController.js')
const { protect } = require('../middleware/authMiddleware.js')

const router = express.Router()

router.route('/')
    .get(protect, getNotifications)

router.post('/test', protect, createTestNotification)
router.put('/read-all', protect, markAllAsRead)
router.delete('/delete-all', protect, deleteAllNotifications)
router.put('/:id/read', protect, markAsRead)
router.delete('/:id', protect, deleteNotification)

module.exports = router
