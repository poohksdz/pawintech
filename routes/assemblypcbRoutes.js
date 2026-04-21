const express = require("express");
const router = express.Router();
const {
  createassemblyPCB,
  getassemblyPCBById,
  getassemblyPCBs,
  getassemblyPCBByUserId,
  updateassemblyPCBById,
  updateDeliveryassemblyPCBById,
  updatePaymentassemblyPCBById,
  updatePCBManufactureAssembly,
  deleteassemblyPCB,
  createassemblyPCBbyAdmin,
  getassemblyPCBByOrderId,
} = require("../controllers/assemblypcbController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

// ==========================
// Routes
// ==========================

// Create — user must be logged in
router.post("/", protect, createassemblyPCB);

// Admin creates order for customer
router.post("/createassemblypcbbyadmin", protect, admin, createassemblyPCBbyAdmin);

// Get all — user must be logged in (admin sees all, others see their own via query)
router.get("/", protect, getassemblyPCBs);

// Get by user — only the specified user's orders (or admin sees all)
router.get("/user/:userId", protect, getassemblyPCBByUserId);

// Get by orderID
router.get("/byorderid/:orderID", protect, getassemblyPCBByOrderId);

// Update order — any authenticated user (ownership checked in controller)
router.put("/:id", protect, updateassemblyPCBById);

// Update delivery — authenticated user (ownership checked in controller)
router.put("/delivery/:id", protect, updateDeliveryassemblyPCBById);

// Update payment status — Admin only
router.put("/paymentrates/:id", protect, admin, updatePaymentassemblyPCBById);

// Update manufacture order — any authenticated user (ownership checked in controller)
router.put("/:pcborderId/pcbmanufacture", protect, updatePCBManufactureAssembly);

// Get by ID — must be logged in
router.get("/:id", protect, getassemblyPCBById);

// Delete — Admin only
router.delete("/:id", protect, admin, deleteassemblyPCB);

module.exports = router;
