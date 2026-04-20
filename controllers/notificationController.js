const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js");

// @desc    Get user notifications (Personal + Global)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    // Prepare role filter
    // Current system uses flags like isAdmin, isStore, isPCBAdmin
    const roles = ["all"];
    if (Number(req.user?.isAdmin) === 1) roles.push("isAdmin");
    if (Number(req.user?.isStore) === 1) roles.push("isStore");
    if (Number(req.user?.isPCBAdmin) === 1) roles.push("isPCBAdmin");

    // 1. Get Personal Notifications
    const [personalNotis] = await pool.query(
      `SELECT n.id, n.message, n.type, n.isRead, COALESCE(n.created_at, n.createdAt, NOW()) AS created_at, p.img AS product_img, 'personal' AS scope
       FROM tbl_notifications n
       LEFT JOIN tbl_product p ON n.related_id = p.ID
       WHERE n.user_id = ?
       ORDER BY n.id DESC LIMIT 50`,
      [userId],
    );

    // 2. Get Global Announcements
    const [globalNotis] = await pool.query(
      `SELECT g.id, g.message, g.type, g.created_at, 'global' AS scope,
              IF(r.announcement_id IS NOT NULL, TRUE, FALSE) AS isRead
       FROM tbl_global_announcements g
       LEFT JOIN tbl_user_read_announcements r ON g.id = r.announcement_id AND r.user_id = ?
       WHERE g.targetRole IN (?)
       AND (r.is_deleted IS NULL OR r.is_deleted = FALSE)
       ORDER BY g.id DESC LIMIT 50`,
      [userId, roles],
    );

    // Combine and sort by date descending
    const allNotifications = [...personalNotis, ...globalNotis]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50);

    // Map created_at to createdAt for frontend consistency if needed
    const formatted = allNotifications.map((n) => ({
      ...n,
      createdAt: n.created_at,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error in getNotifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { scope } = req.body; // 'personal' or 'global'

    if (scope === "global") {
      await pool.query(
        "INSERT IGNORE INTO tbl_user_read_announcements (user_id, announcement_id, isRead) VALUES (?, ?, TRUE)",
        [userId, req.params.id],
      );
    } else {
      await pool.query(
        "UPDATE tbl_notifications SET isRead = TRUE WHERE id = ? AND user_id = ?",
        [req.params.id, userId],
      );
    }
    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error("❌ Error in markAsRead:", error);
    return res.status(500).json({ message: "Failed to mark as read" });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    // 1. Update all Personal
    await pool.query(
      "UPDATE tbl_notifications SET isRead = TRUE WHERE user_id = ?",
      [userId],
    );

    // 2. Mark all eligible Global as read
    const roles = ["all"];
    if (Number(req.user?.isAdmin) === 1) roles.push("isAdmin");
    if (Number(req.user?.isStore) === 1) roles.push("isStore");
    if (Number(req.user?.isPCBAdmin) === 1) roles.push("isPCBAdmin");

    await pool.query(
      `INSERT IGNORE INTO tbl_user_read_announcements (user_id, announcement_id, isRead)
       SELECT ?, id, TRUE FROM tbl_global_announcements
       WHERE targetRole IN (?)`,
      [userId, roles],
    );

    res.json({ message: "All marked as read" });
  } catch (error) {
    console.error("❌ Error in markAllAsRead:", error);
    return res.status(500).json({ message: "Failed to mark all as read" });
  }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    // We can pass scope via query param or body
    const scope = req.query.scope || req.body.scope || "personal";

    if (scope === "global") {
      await pool.query(
        `INSERT INTO tbl_user_read_announcements (user_id, announcement_id, is_deleted) 
         VALUES (?, ?, TRUE) 
         ON DUPLICATE KEY UPDATE is_deleted = TRUE`,
        [userId, req.params.id],
      );
    } else {
      await pool.query(
        "DELETE FROM tbl_notifications WHERE id = ? AND user_id = ?",
        [req.params.id, userId],
      );
    }
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("❌ Error in deleteNotification:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

// @desc    Delete all notifications
// @route   DELETE /api/notifications/delete-all
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    // 1. Delete Personal
    await pool.query("DELETE FROM tbl_notifications WHERE user_id = ?", [
      userId,
    ]);

    // 2. Mark all Global as deleted
    const roles = ["all"];
    if (Number(req.user?.isAdmin) === 1) roles.push("isAdmin");
    if (Number(req.user?.isStore) === 1) roles.push("isStore");
    if (Number(req.user?.isPCBAdmin) === 1) roles.push("isPCBAdmin");

    await pool.query(
      `INSERT INTO tbl_user_read_announcements (user_id, announcement_id, is_deleted)
       SELECT ?, id, TRUE FROM tbl_global_announcements
       WHERE targetRole IN (?)
       ON DUPLICATE KEY UPDATE is_deleted = TRUE`,
      [userId, roles],
    );

    res.json({ message: "All notifications deleted" });
  } catch (error) {
    console.error("❌ Error in deleteAllNotifications:", error);
    return res.status(500).json({ message: "Failed to delete all notifications" });
  }
});

/**
 * createBroadcastNotification
 * Supports two calling styles:
 * 1. API: (req, res)
 * 2. Internal Service: (options object)
 */
const createBroadcastNotification = async (arg1, arg2) => {
  // Style 1: API (req, res)
  if (arg1 && arg1.body && arg2 && typeof arg2.status === "function") {
    const req = arg1;
    const res = arg2;
    try {
      const { message, type, related_id, targetRole } = req.body;
      const [result] = await pool.query(
        "INSERT INTO tbl_global_announcements (message, type, related_id, targetRole) VALUES (?, ?, ?, ?)",
        [message, type || "info", related_id || null, targetRole || "all"],
      );
      res
        .status(201)
        .json({ message: "Broadcast created globally", id: result.insertId });
    } catch (error) {
      console.error("❌ Error in createBroadcastNotification (API):", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างประกาศ" });
    }
    return;
  }

  // Style 2: Internal Service ({ message, type, ... })
  const options = arg1;
  try {
    const { message, type, related_id, targetRole } = options;
    const [result] = await pool.query(
      "INSERT INTO tbl_global_announcements (message, type, related_id, targetRole) VALUES (?, ?, ?, ?)",
      [message, type || "info", related_id || null, targetRole || "all"],
    );
    return result.insertId;
  } catch (error) {
    console.error(
      "❌ Error in createBroadcastNotification (Internal):",
      error,
    );
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createBroadcastNotification,
};
