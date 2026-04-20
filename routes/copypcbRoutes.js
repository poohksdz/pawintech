const express = require("express");
const router = express.Router();
const {
  createcopyPCB,
  getcopyPCBById,
  getcopyPCBs,
  getcopyPCBByUserId,
  updatecopyPCBById,
  updateDeliverycopyPCBById,
  deletecopyPCB,
  createcopyPCBbyAdmin,
  getcopyPCBByOrderId,
} = require("../controllers/copypcbcontroller.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

// ==========================
// Routes
// ==========================

// Create
router.post("/", protect, createcopyPCB);
router.post("/createcopypcbbyadmin", protect, admin, createcopyPCBbyAdmin);

// Get all
router.get("/", protect, getcopyPCBs);

// Get by user
router.get("/user/:userId", protect, getcopyPCBByUserId);

// Get by orderID (ทำให้เหมือน custompcb)
router.get("/byorderid/:orderID", protect, getcopyPCBByOrderId);

// Update order
router.put("/:id", protect, updatecopyPCBById);

//  ทำให้เหมือน custompcb
router.put("/delivery/:id", protect, updateDeliverycopyPCBById);

// Get by ID (ต้องอยู่ล่างสุดของ GET dynamic)
router.get("/:id", protect, getcopyPCBById);

// Delete
router.delete("/:id", protect, admin, deletecopyPCB);

module.exports = router;
