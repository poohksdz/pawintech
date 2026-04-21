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
    if (!userId) return res.status(401).json({ message: "User ID not found" });

    const safeRoles = buildRoleList(req.user);
    const placeholders = safeRoles.map(() => "?").join(", ");
    const roleParams = [userId, ...safeRoles];

    let [personalNotis] = await pool.query(
      `SELECT n.id, n.message, n.type, n.isRead, COALESCE(n.createdAt, n.created_at, NOW()) AS created_at, 'personal' AS scope
       FROM tbl_notifications n WHERE n.user_id = ? ORDER BY n.id DESC LIMIT 50`, [userId]
    ).catch(() => [[]]);

    let [globalNotis] = safeRoles.length > 0 ? await pool.query(
      `SELECT g.id, g.message, g.type, g.created_at, 'global' AS scope,
              IF(r.announcement_id IS NOT NULL, TRUE, FALSE) AS isRead
       FROM tbl_global_announcements g
       LEFT JOIN tbl_user_read_announcements r ON g.id = r.announcement_id AND r.user_id = ?
       WHERE g.targetRole IN (${placeholders}) AND (r.is_deleted IS NULL OR r.is_deleted = FALSE)
       ORDER BY g.id DESC LIMIT 50`, roleParams
    ) : [[]];

    const allNotifications = [...(personalNotis[0] || []), ...(globalNotis[0] || [])]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50)
      .map((n) => ({ ...n, createdAt: n.created_at }));

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

module.exports = { getNotifications, markAsRead };
