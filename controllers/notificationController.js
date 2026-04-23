const asyncHandler = require("../middleware/asyncHandler.js");
const { pool } = require("../config/db.js");

const buildRoleList = (user) => {
  const roles = ["all"];
  if (Number(user?.isAdmin) === 1) roles.push("isAdmin");
  if (Number(user?.isStore) === 1) roles.push("isStore");
  if (Number(user?.isPCBAdmin) === 1) roles.push("isPCBAdmin");
  return roles.filter((r) => /^[a-zA-Z0-9_]+$/.test(r)).map((r) => r.replace(/[^a-zA-Z0-9_]/g, "")).filter(Boolean);
};

const getNotifications = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.json([]);

    const safeRoles = buildRoleList(req.user);
    const placeholders = safeRoles.map(() => "?").join(", ");
    const roleParams = [userId, ...safeRoles];

    let personalNotis = [[]];
    try {
      const result = await pool.query(
        "SELECT n.id, n.message, n.type, n.isRead, COALESCE(n.createdAt, n.created_at, n.id, NOW()) AS created_at, 'personal' AS scope FROM tbl_notifications n WHERE n.user_id = ? ORDER BY n.id DESC LIMIT 50",
        [userId]
      );
      personalNotis = result;
    } catch (e) {
      console.warn("Personal notifications query failed:", e.message);
    }

    let globalNotis = [[]];
    if (safeRoles.length > 0) {
      try {
        const result = await pool.query(
          "SELECT g.id, g.message, g.type, COALESCE(g.created_at, g.id, NOW()) AS created_at, 'global' AS scope, IF(r.announcement_id IS NOT NULL, TRUE, FALSE) AS isRead FROM tbl_global_announcements g LEFT JOIN tbl_user_read_announcements r ON g.id = r.announcement_id AND r.user_id = ? WHERE g.targetRole IN (" + placeholders + ") AND (r.is_deleted IS NULL OR r.is_deleted = FALSE) ORDER BY g.id DESC LIMIT 50",
          roleParams
        );
        globalNotis = result;
      } catch (e) {
        console.warn("Global notifications query failed:", e.message);
      }
    }

    const allNotifications = [...(personalNotis[0] || []), ...(globalNotis[0] || [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50)
      .map((n) => ({ ...n, createdAt: n.created_at }));

    res.json(allNotifications);
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.json([]);
  }
});

const markAsRead = asyncHandler(async (req, res) => {
  const { scope } = req.body;
  const notificationId = Number(req.params.id);
  const userId = req.user?._id || req.user?.id;
  if (!userId) return res.status(401).json({ message: "User ID not found" });

  if (scope === "global") {
    await pool.query(
      "INSERT INTO tbl_user_read_announcements (user_id, announcement_id, isRead, is_deleted) VALUES (?, ?, TRUE, FALSE) ON DUPLICATE KEY UPDATE isRead = TRUE",
      [userId, notificationId]
    );
  } else {
    await pool.query(
      "UPDATE tbl_notifications SET isRead = TRUE WHERE id = ? AND user_id = ?",
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
      "UPDATE tbl_notifications SET isRead = TRUE WHERE user_id = ? AND isRead = FALSE",
      [userId],
    ),
    safeRoles.length > 0
      ? pool.query(
        "INSERT IGNORE INTO tbl_user_read_announcements (user_id, announcement_id, isRead) SELECT ?, id, TRUE FROM tbl_global_announcements WHERE targetRole IN (" + rolePlaceholders + ") AND id NOT IN (SELECT announcement_id FROM tbl_user_read_announcements WHERE user_id = ?)",
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
        "INSERT INTO tbl_user_read_announcements (user_id, announcement_id, is_deleted) VALUES (?, ?, TRUE) ON DUPLICATE KEY UPDATE is_deleted = TRUE",
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
      "DELETE FROM tbl_notifications WHERE id = ? AND user_id = ?",
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
    pool.query("DELETE FROM tbl_notifications WHERE user_id = ?", [userId]),
    safeRoles.length > 0
      ? pool.query(
        "INSERT INTO tbl_user_read_announcements (user_id, announcement_id, is_deleted) SELECT ?, id, TRUE FROM tbl_global_announcements WHERE targetRole IN (" + rolePlaceholders + ") ON DUPLICATE KEY UPDATE is_deleted = TRUE",
        [userId, ...safeRoles],
      )
      : Promise.resolve(),
  ]);

  res.json({ message: "All notifications deleted" });
});

// ️ สร้าง notification สำหรับการชำระเงินสำเร็จ
const createPaymentNotification = asyncHandler(async (req, res) => {
  try {
    const { user_id, order_id, order_type, amount } = req.body;

    if (!user_id || !order_id) {
      return res.status(400).json({ message: "user_id และ order_id จำเป็น" });
    }

    const message = `💳 ชำระเงินสำเร็จ! คำสั่งซื้อ #${order_id} (${order_type || 'สินค้า'}) ยอด ${parseFloat(amount || 0).toFixed(2)} บาท`;

    const [result] = await pool.query(
      "INSERT INTO tbl_notifications (user_id, message, type, related_id, isRead, createdAt) VALUES (?, ?, ?, ?, FALSE, NOW())",
      [user_id, message, "payment_success", order_id]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: "แจ้งเตือนถูกสร้างแล้ว"
    });
  } catch (error) {
    console.error("Error creating payment notification:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างแจ้งเตือน" });
  }
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
      return res.status(500).json({ message: "Failed to create broadcast" });
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

  try {
    await pool.query("ALTER TABLE tbl_notifications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    logs.push("Added missing column 'created_at' to 'tbl_notifications'");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      logs.push("Column 'created_at' already exists in 'tbl_notifications'");
    } else {
      logs.push("Error adding 'created_at': " + err.message);
    }
  }

  try {
    await pool.query("ALTER TABLE tbl_global_announcements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    logs.push("Added missing column 'created_at' to 'tbl_global_announcements'");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      logs.push("Column 'created_at' already exists in 'tbl_global_announcements'");
    } else {
      logs.push("Error adding 'created_at': " + err.message);
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