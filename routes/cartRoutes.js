const express = require("express");
const router = express.Router();
const { getCart, updateCart } = require("../controllers/cartController.js");
const { protect } = require("../middleware/authMiddleware.js"); // Middleware เช็ค Login

// บังคับว่าต้อง Login (protect) ถึงจะดึงหรือบันทึกตะกร้าได้
router.route("/").get(protect, getCart).post(protect, updateCart);

module.exports = router;
