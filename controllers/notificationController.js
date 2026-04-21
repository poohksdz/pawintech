const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js");

const buildRoleList = (user) => {
  try {
    const roles = ["all"];
    if (user?.isAdmin === true || user?.isAdmin === 1 || Number(user?.isAdmin) === 1) roles.push("isAdmin");
    if (user?.isStore === true || user?.isStore === 1 || Number(user?.isStore) === 1) roles.push("isStore");
    if (user?.isPCBAdmin === true || user?.isPCBAdmin === 1 || Number(user?.isPCBAdmin) === 1) roles.push("isPCBAdmin");
    // Only allow known safe role names
    return roles
      .filter((r) => r && typeof r === 'string' && /^[a-zA-Z0-9_]+$/.test(r))
      .map((r) => r.replace(/[^a-zA-Z0-9_]/g, ""))
      .filter(Boolean);
  } catch (err) {
    console.warn("buildRoleList error:", err.message);
    return ["all"]; // Safe fallback
  }
};

// @desc    Get user notifications (Personal + Global)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User ID not found" });
    }

    const safeRoles = buildRoleList(req.user);

    let personalRows = [[]];
    let globalRows = [[]];

    // Fetch personal notifications with error handling
    try {
      const [rows] = await pool.query(
        `SELECT * FROM tbl_notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50`,
        [userId],
      );
      personalRows = [rows];
    } catch (err) {
      console.warn("tbl_notifications table or columns missing:", err.message);
      personalRows = [[]];
    }

    // Fetch global announcements with error handling
    if (safeRoles.length > 0) {
      try {
        const placeholders = safeRoles.map(() => "?").join(", ");
        const roleParams = [userId, ...safeRoles];
        const [rows] = await pool.query(
          `SELECT g.*, r.announcement_id AS r_announcement_id, r.is_deleted AS r_is_deleted 
             FROM tbl_global_announcements g
             LEFT JOIN tbl_user_read_announcements r
               ON g.id = r.announcement_id AND r.user_id = ?
             WHERE g.targetRole IN (${placeholders})
               AND (r.is_deleted IS NULL OR r.is_deleted = FALSE)
             ORDER BY g.id DESC
             LIMIT 50`,
          roleParams,
        );
        globalRows = [rows];
      } catch (err) {
        console.warn("tbl_global_announcements or tbl_user_read_announcements error:", err.message);
        try {
          // Fallback: try without is_deleted column
          const placeholders = safeRoles.map(() => "?").join(", ");
          const roleParams = [userId, ...safeRoles];
          const [rows] = await pool.query(
            `SELECT g.*, r.announcement_id AS r_announcement_id 
               FROM tbl_global_announcements g
               LEFT JOIN tbl_user_read_announcements r
                 ON g.id = r.announcement_id AND r.user_id = ?
               WHERE g.targetRole IN (${placeholders})
               ORDER BY g.id DESC
               LIMIT 50`,
            roleParams,
          );
          globalRows = [rows];
        } catch (fallbackErr) {
          console.warn("Fallback query also failed:", fallbackErr.message);
          globalRows = [[]];
        }
      }
    }

    // Use JS mapping to safely pull correct column names regardless of database schema changes
    const personalNotis = (personalRows[0] || []).map(n => ({
      ...n,
      id: n.id || n._id,
      type: n.type || "system",
      message: n.message || n.content || "",
      // Handle various column name conventions for isRead
      isRead: Boolean(
        n.isRead !== undefined ? n.isRead :
          n.is_read !== undefined ? n.is_read :
            n.isReaded !== undefined ? n.isReaded :
              n.read !== undefined ? n.read : false
      ),
      // Handle various column name conventions for createdAt
      createdAt: n.created_at || n.createdAt || n.create_at || n.Create_at || n.date || n.Date || new Date(),
      scope: 'personal' // Add scope manually
    }));

    const globalNotis = (globalRows[0] || []).map(g => ({
      ...g,
      id: g.id || g._id,
      type: g.type || "system",
      message: g.message || g.content || "",
      isRead: Boolean(g.r_announcement_id !== null && g.r_announcement_id !== undefined),
      // Handle various column name conventions for createdAt
      createdAt: g.created_at || g.createdAt || g.create_at || g.Create_at || g.date || g.Date || new Date(),
      scope: 'global' // Add scope manually
    }));

    const allNotifications = [...personalNotis, ...globalNotis]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    res.json(allNotifications);
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

const markAsRead = asyncHandler(async (req, res) => {
  const { scope } = req.body;
  const notificationId = Number(req.params.id);
  const userId = req.user?._id || req.user?.id;
  if (!userId) return res.status(401).json({ message: "User ID not found" });

  if (scope === "global") {
    await pool.query(
      `INSERT INTO tbl_user_read_announcements (user_id, announcement_id, isRead, is_deleted)
       VALUES (?, ?, TRUE, FALSE)
       ON DUPLICATE KEY UPDATE isRead = TRUE`,
      [userId, notificationId]
    );
  } else {
    await pool.query(
      `UPDATE tbl_notifications SET isRead = TRUE WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
  }
  res.json({ success: true });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User ID not found" });
  }

  const safeRoles = buildRoleList(req.user);
  const rolePlaceholders = safeRoles.map(() => "?").join(", ");

  await Promise.all([
    pool.query(
      `UPDATE tbl_notifications SET isRead = TRUE WHERE user_id = ? AND isRead = FALSE`,
      [userId],
    ),
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
      await pool.query(
        `INSERT INTO tbl_user_read_announcements (user_id, announcement_id, is_deleted)
         VALUES (?, ?, TRUE)
         ON DUPLICATE KEY UPDATE is_deleted = TRUE`,
        [userId, notificationId],
      );
    } catch (err) {
      console.warn("is_deleted column missing. Simulating delete by marking as read:", err.message);
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

const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "User ID not found" });
  }

  const safeRoles = buildRoleList(req.user);
  const rolePlaceholders = safeRoles.map(() => "?").join(", ");

  await Promise.all([
    pool.query(`DELETE FROM tbl_notifications WHERE user_id = ?`, [userId]),
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

const createBroadcastNotification = async (arg1, arg2, next) => {
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
        "Insert INTO tbl_global_announcements (message, type, related_id, targetRole, created_at) VALUES (?, ?, ?, ?, NOW())",
        [message.trim(), type || "info", related_id || null, safeTargetRole],
      );
      return res.status(201).json({ message: "Broadcast created globally", id: result.insertId });
    } catch (error) {
      console.error("Error in createBroadcastNotification (API):", error);
      if (next) return next(error);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างประกาศ" });
    }
  }

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
    console.error("Error in createBroadcastNotification (Internal):", error);
    throw error;
  }
};

const migrateDatabase = asyncHandler(async (req, res) => {
  let logs = [];

  try {
    await pool.query("ALTER TABLE tbl_user_read_announcements ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE");
    logs.push("Added missing column 'is_deleted' to 'tbl_user_read_announcements'");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      logs.push("Column 'is_deleted' already exists in 'tbl_user_read_announcements'");
    } else {
      logs.push("Error adding 'is_deleted': " + err.message);
    }
  }

  res.json({ message: "Database schema migration applied successfully!", details: logs });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createBroadcastNotification,
  migrateDatabase,
};