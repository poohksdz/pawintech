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

// ==========================
// Routes
// ==========================

// Create
router.post("/", createCustomPCB);
router.post("/createcustompcbbyadmin", createCustomPCBbyAdmin);

// Get all
router.get("/", getCustomPCBs);

// Get by user
router.get("/user/:userId", getCustomPCBByUserId);

// Get by orderID
router.get("/byorderid/:orderID", getCustomPCBByOrderId);

// Update order
router.put("/:id", updateCustomPCBById);

// Update delivery
router.put("/delivery/:id", updateDeliveryCustomPCBById);

// Update payment status (Admin)
router.put("/paymentrates/:id", updatePaymentCustomPCBById);

// Get by ID (ต้องอยู่ล่างสุดของ GET dynamic)
router.get("/:id", getCustomPCBById);

// Delete
router.delete("/:id", deleteCustomPCB);

module.exports = router;
