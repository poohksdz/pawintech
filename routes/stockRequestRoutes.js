const express = require("express");
const {
  createStockRequestgood,
  updateStockRequestgood,
  deleteStockRequestgood,
  getStockRequestgood,
  getStockRequestgoodDetails,
  updateStockRequestgoodQty,
  getStockRequestgoodUser,
  getStockRequestImportance,
  getStockRequestAllImportance,
  getStockRequestImportanceByUserId,
  updateStockRequestgoodImportance,
  getStockRequestCancel,
  getStockRequestCancelByUserId,
  updateStockRequestgoodCancel,
} = require("../controllers/stockRequestController");

const { protect, admin } = require("../middleware/authMiddleware.js");

const router = express.Router();

// ==================================================================
//  โซนพิเศษ (Specific Routes) - ต้องวางไว้ "บนสุด" เท่านั้น! 
// ==================================================================

// 1. เส้นทางดึงข้อมูล User (ต้องมาก่อน /:id ไม่งั้นคำว่า 'user' จะถูกมองเป็น id)
router.route("/user/:id").get(protect, getStockRequestgoodUser);

// 2. เส้นทางอื่นๆ ที่มีคำนำหน้าเฉพาะ
router.route("/updaterequestqty/:id").put(protect, updateStockRequestgoodQty);

// Importance Routes
router.route("/importance/all").get(getStockRequestAllImportance);
router.route("/importance/update/:id").put(updateStockRequestgoodImportance);
router.route("/importance/:userId").get(getStockRequestImportanceByUserId);
router.route("/importance").get(getStockRequestImportance);

// Cancel Routes
router.route("/cancel/update/:id").put(updateStockRequestgoodCancel);
router.route("/cancel/:userId").get(getStockRequestCancelByUserId);
router.route("/cancel").get(getStockRequestCancel);

// ==================================================================
//  โซนทั่วไป (Root & Generic ID) - ต้องวางไว้ "ล่างสุด"
// ==================================================================

router
  .route("/")
  .post(protect, createStockRequestgood)
  .get(getStockRequestgood);

// ️ อันนี้ตัวปัญหา! ต้องอยู่ล่างสุดเสมอ เพราะมันรับทุกอย่างที่เป็นตัวอักษรต่อท้าย
router
  .route("/:id")
  .get(getStockRequestgoodDetails)
  .delete(protect, deleteStockRequestgood)
  .put(protect, updateStockRequestgood);

module.exports = router;
