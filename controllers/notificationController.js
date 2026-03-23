const asyncHandler = require('../middleware/asyncHandler.js')
const { pool } = require('../config/db.js')

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;

        const [rows] = await pool.query(
            'SELECT n.*, p.img AS product_img FROM tbl_notifications n LEFT JOIN tbl_product p ON n.related_id = p.id WHERE n.user_id = ? ORDER BY n.id DESC LIMIT 50',
            [userId]
        )
        res.json(rows)
    } catch (error) {
        console.error('❌ Error in getNotifications:', error);
        res.status(500);
        throw error;
    }
})

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        await pool.query(
            'UPDATE tbl_notifications SET isRead = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, userId]
        )
        res.json({ message: 'Marked as read' })
    } catch (error) {
        console.error('❌ Error in markAsRead:', error);
        res.status(500);
        throw error;
    }
})

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        await pool.query(
            'UPDATE tbl_notifications SET isRead = TRUE WHERE user_id = ?',
            [userId]
        )
        res.json({ message: 'All marked as read' })
    } catch (error) {
        console.error('❌ Error in markAllAsRead:', error);
        res.status(500);
        throw error;
    }
})

// @desc    Create a test notification
// @route   POST /api/notifications/test
// @access  Private
const createTestNotification = asyncHandler(async (req, res) => {
    try {
        const { message, type, related_id } = req.body || {}
        const userId = req.user?._id || req.user?.id;


        if (!userId) {
            res.status(401);
            throw new Error('User ID not found');
        }

        const [result] = await pool.query(
            'INSERT INTO tbl_notifications (user_id, message, type, related_id) VALUES (?, ?, ?, ?)',
            [
                userId,
                message || 'This is a premium test notification!',
                type || 'test',
                related_id || null
            ]
        )
        res.status(201).json({ message: 'Test notification created', id: result.insertId })
    } catch (error) {
        console.error('❌ Error in createTestNotification:', error);
        res.status(500).json({ message: error.message });
    }
})

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        await pool.query(
            'DELETE FROM tbl_notifications WHERE id = ? AND user_id = ?',
            [req.params.id, userId]
        )
        res.json({ message: 'Notification deleted' })
    } catch (error) {
        console.error('❌ Error in deleteNotification:', error);
        res.status(500);
        throw error;
    }
})

// @desc    Delete all notifications
// @route   DELETE /api/notifications/delete-all
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        await pool.query(
            'DELETE FROM tbl_notifications WHERE user_id = ?',
            [userId]
        )
        res.json({ message: 'All notifications deleted' })
    } catch (error) {
        console.error('❌ Error in deleteAllNotifications:', error);
        res.status(500);
        throw error;
    }
})

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createTestNotification,
    deleteNotification,
    deleteAllNotifications,
}
