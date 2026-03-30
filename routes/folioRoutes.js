const express = require("express");
const router = express.Router();

// เรียก Controller
const {
  getFolios,
  getFolioById,
  createFolio,
  updateFolio, // ️ ตัวนี้แหละที่ Error ก่อนหน้านี้ (ถ้ามันไม่มีใน controller)
  deleteFolio,
} = require("../controllers/folioController.js");

// เรียก Middleware
const { protect, admin } = require("../middleware/authMiddleware.js");

// กำหนด Route
router.route("/").get(getFolios).post(protect, admin, createFolio);

router
  .route("/:id")
  .get(getFolioById)
  .put(protect, admin, updateFolio) //  บรรทัดที่ 17 (ที่เป็นปัญหา)
  .delete(protect, admin, deleteFolio);

module.exports = router;
