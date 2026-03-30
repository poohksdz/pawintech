const express = require("express");
const router = express.Router();
const {
  createassemblyPCB,
  getassemblyPCBById,
  getassemblyPCBs,
  getassemblyPCBByUserId,
  updateassemblyPCBById,
  updateDeliveryassemblyPCBById,
  deleteassemblyPCB,
  createassemblyPCBbyAdmin,
  getassemblyPCBByOrderId,
} = require("../controllers/assemblypcbController.js");

// ==========================
// Routes
// ==========================

// Create
router.post("/", createassemblyPCB);
router.post("/createassemblypcbbyadmin", createassemblyPCBbyAdmin);

// Get all
router.get("/", getassemblyPCBs);

// Get by user
router.get("/user/:userId", getassemblyPCBByUserId);

// Get by orderID (ทำให้เหมือน custompcb/copypcb)
router.get("/byorderid/:orderID", getassemblyPCBByOrderId);

// Update order
router.put("/:id", updateassemblyPCBById);

//  ทำให้เหมือน custompcb/copypcb
router.put("/delivery/:id", updateDeliveryassemblyPCBById);

// Get by ID (ต้องอยู่ล่างสุดของ GET dynamic)
router.get("/:id", getassemblyPCBById);

// Delete
router.delete("/:id", deleteassemblyPCB);

module.exports = router;
