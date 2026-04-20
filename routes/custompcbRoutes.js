const express = require("express");
const router = express.Router();
const {
  createCustomPCB,
  getCustomPCBById,
  getCustomPCBs,
  getCustomPCBByUserId,
  updateCustomPCBById,
  updateDeliveryCustomPCBById,
  updatePaymentCustomPCBById, //  เพิ่มฟังก์ชันอนุมัติการชำระเงิน
  deleteCustomPCB,
  createCustomPCBbyAdmin,
  getCustomPCBByOrderId,
} = require("../controllers/custompcbController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

// ==========================
// Routes
// ==========================

// Create
router.post("/", protect, createCustomPCB);
router.post("/createcustompcbbyadmin", protect, admin, createCustomPCBbyAdmin);

// Get all
router.get("/", protect, getCustomPCBs);

// Get by user
router.get("/user/:userId", protect, getCustomPCBByUserId);

// Get by orderID
router.get("/byorderid/:orderID", protect, getCustomPCBByOrderId);

// Update order
router.put("/:id", protect, updateCustomPCBById);

// Update delivery
router.put("/delivery/:id", protect, updateDeliveryCustomPCBById);

// Update payment status (Admin)
router.put("/paymentrates/:id", protect, admin, updatePaymentCustomPCBById);

// Get by ID (ต้องอยู่ล่างสุดของ GET dynamic)
router.get("/:id", protect, getCustomPCBById);

// Delete
router.delete("/:id", protect, admin, deleteCustomPCB);

module.exports = router;
