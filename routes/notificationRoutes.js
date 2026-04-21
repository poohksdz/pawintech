const express = require("express");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createBroadcastNotification,
  migrateDatabase,
} = require("../controllers/notificationController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.route("/migrate").get(migrateDatabase);
router.route("/").get(protect, getNotifications);

router.post("/broadcast", protect, admin, createBroadcastNotification);
router.put("/read-all", protect, markAllAsRead);
router.delete("/delete-all", protect, deleteAllNotifications);
router.put("/:id/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);

module.exports = router;
