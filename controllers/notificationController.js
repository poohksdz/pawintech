const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js");

// Helper: build safe role list for SQL IN-clause (no injection risk)
const buildRoleList = (user) => {
  const roles = ["all"];
  if (Number(user?.isAdmin) === 1) roles.push("isAdmin");
  if (Number(user?.isStore) === 1) roles.push("isStore");
  if (Number(user?.isPCBAdmin) === 1) roles.push("isPCBAdmin");
  // Only allow known safe role names
  return roles
    .filter((r) => /^[a-zA-Z0-9_]+$/.test(r))
    .map((r) => r.replace(/[^a-zA-Z0-9_]/g, ""))
    .filter(Boolean);
};

// @desc    Get user notifications (Personal + Global)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User ID not found" });
  }

  const safeRoles = buildRoleList(req.user);
  const placeholders = safeRoles.map(() => "?").join(", ");
  const roleParams = [userId, ...safeRoles];

  // Fetch both in parallel for speed
  const [personalRows, globalRows] = await Promise.all([
    pool.query(
      `SELECT * FROM tbl_notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50`,
      [userId],
    ),
    safeRoles.length > 0
      ? pool.query(
        `SELECT g.*, r.announcement_id AS r_announcement_id, r.is_deleted AS r_is_deleted 
           FROM tbl_global_announcements g
           LEFT JOIN tbl_user_read_announcements r
             ON g.id = r.announcement_id AND r.user_id = ?
           WHERE g.targetRole IN (${placeholders})
             AND (r.is_deleted IS NULL OR r.is_deleted = FALSE)
           ORDER BY g.id DESC
           LIMIT 50`,
        roleParams,
      ).catch((err) => {
        console.warn("is_deleted column missing, falling back to legacy global query:", err.message);
        return pool.query(
          `SELECT g.*, r.announcement_id AS r_announcement_id 
             FROM tbl_global_announcements g
             LEFT JOIN tbl_user_read_announcements r
               ON g.id = r.announcement_id AND r.user_id = ?
             WHERE g.targetRole IN (${placeholders})
             ORDER BY g.id DESC
             LIMIT 50`,
          roleParams,
        );
      })
      : [[]],
  ]);

  // Use JS mapping to safely pull correct column names regardless of database schema changes
  const personalNotis = (personalRows[0] || []).map(n => ({
    ...n,
    id: n.id || n._id,
    type: n.type || "system",
    message: n.message || n.content || "",
    isRead: Boolean(n.isRead !== undefined ? n.isRead : (n.is_read || false)),
    createdAt: n.created_at || n.createdAt || n.date || new Date(),
    scope: 'personal' // Add scope manually
  }));

  const globalNotis = (globalRows[0] || []).map(g => ({
    ...g,
    id: g.id || g._id,
    type: g.type || "system",
    message: g.message || g.content || "",
    isRead: Boolean(g.r_announcement_id !== null && g.r_announcement_id !== undefined),
    createdAt: g.created_at || g.createdAt || g.date || new Date(),
    scope: 'global' // Add scope manually
  }));

  const allNotifications = [...personalNotis, ...globalNotis]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);

  res.json(allNotifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User ID not found" });
  }

  const { scope } = req.body;
  const notificationId = Number(req.params.id);

  if (!notificationId || !scope) {
    return res.status(400).json({ message: "Invalid params" });
  }

  if (scope === "global") {
    await pool.query(
      `INSERT IGNORE INTO tbl_user_read_announcements
       (user_id, announcement_id, isRead)
       VALUES (?, ?, TRUE)`,
      [userId, notificationId],
    );
  } else {
    const [result] = await pool.query(
      `UPDATE tbl_notifications
       SET isRead = TRUE
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
  }

  res.json({ message: "Marked as read" });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User ID not found" });
  }

  const safeRoles = buildRoleList(req.user);
  const rolePlaceholders = safeRoles.map(() => "?").join(", ");

  await Promise.all([
    // Personal: update all unread
    pool.query(
      `UPDATE tbl_notifications SET isRead = TRUE WHERE user_id = ? AND isRead = FALSE`,
      [userId],
    ),
    // Global: insert IGNORE for each matching announcement
    safeRoles.length > 0
      ? pool.query(
        `INSERT IGNORE INTO tbl_user_read_announcements
           (user_id, announcement_id, isRead)
           SELECT ?, id, TRUE
           FROM tbl_global_announcements
           WHERE targetRole IN (${rolePlaceholders})
             AND id NOT IN (
               SELECT announcement_id FROM tbl_user_read_announcements WHERE user_id = ?
             )`,
        [userId, ...safeRoles, userId],
      )
      : Promise.resolve(),
  ]);

  res.json({ message: "All marked as read" });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User ID not found" });
  }

  const scope = req.query.scope || req.body.scope || "personal";
  const notificationId = Number(req.params.id);

  if (!notificationId) {
    return res.status(400).json({ message: "Invalid notification ID" });
  }

  if (scope === "global") {
    try {
      // Try to use the is_deleted column
      await pool.query(
        `INSERT INTO tbl_user_read_announcements (user_id, announcement_id, is_deleted)
         VALUES (?, ?, TRUE)
         ON DUPLICATE KEY UPDATE is_deleted = TRUE`,
        [userId, notificationId],
      );
    } catch (err) {
      console.warn("is_deleted column missing. Simulating delete by marking as read:", err.message);
      // Fall back to just marking it as read (since we can't truly delete it without the column)
      await pool.query(
        "INSERT IGNORE INTO tbl_user_read_announcements (user_id, announcement_id) VALUES (?, ?)",
        [userId, notificationId],
      );
    }
    res.json({ message: "Global notification hidden" });
  } else {
    const [result] = await pool.query(
      `DELETE FROM tbl_notifications WHERE id = ? AND user_id = ?`,
      [notificationId, userId],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  }
});

// @desc    Delete all notifications
// @route   DELETE /api/notifications/delete-all
// @access  Private
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User ID not found" });
  }

  const safeRoles = buildRoleList(req.user);
  const rolePlaceholders = safeRoles.map(() => "?").join(", ");

  await Promise.all([
    // Delete personal
    pool.query(`DELETE FROM tbl_notifications WHERE user_id = ?`, [userId]),
    // Hide global for this user
    safeRoles.length > 0
      ? pool.query(
        `INSERT INTO tbl_user_read_announcements
           (user_id, announcement_id, is_deleted)
           SELECT ?, id, TRUE
           FROM tbl_global_announcements
           WHERE targetRole IN (${rolePlaceholders})
           ON DUPLICATE KEY UPDATE is_deleted = TRUE`,
        [userId, ...safeRoles],
      )
      : Promise.resolve(),
  ]);

  res.json({ message: "All notifications deleted" });
});

/**
 * createBroadcastNotification
 * Supports two calling styles:
 * 1. API: (req, res)
 * 2. Internal Service: (options object)
 */
const createBroadcastNotification = async (arg1, arg2, next) => {
  // Style 1: API (req, res)
  if (arg1 && arg1.body && arg2 && typeof arg2.status === "function") {
    const req = arg1;
    const res = arg2;
    try {
      const { message, type, related_id, targetRole } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
      const safeTargetRole = /^[a-zA-Z0-9_]+$/.test(targetRole || "") ? targetRole : "all";
      const [result] = await pool.query(
        "INSERT INTO tbl_global_announcements (message, type, related_id, targetRole, created_at) VALUES (?, ?, ?, ?, NOW())",
        [message.trim(), type || "info", related_id || null, safeTargetRole],
      );
      return res.status(201).json({ message: "Broadcast created globally", id: result.insertId });
    } catch (error) {
      console.error("❌ Error in createBroadcastNotification (API):", error);
      if (next) return next(error);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างประกาศ" });
    }
  }

  // Style 2: Internal Service ({ message, type, ... })
  const options = arg1;
  try {
    const { message, type, related_id, targetRole } = options || {};
    if (!message || !message.trim()) throw new Error("Message required");
    const safeTargetRole = /^[a-zA-Z0-9_]+$/.test(targetRole || "") ? targetRole : "all";
    const [result] = await pool.query(
      "INSERT INTO tbl_global_announcements (message, type, related_id, targetRole, created_at) VALUES (?, ?, ?, ?, NOW())",
      [message.trim(), type || "info", related_id || null, safeTargetRole],
    );
    return result.insertId;
  } catch (error) {
    console.error("❌ Error in createBroadcastNotification (Internal):", error);
    throw error;
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
