const express = require("express");
const {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updateUserStaff,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
  updateUserProfileShipping,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/userController.js");

const { protect, admin } = require("../middleware/authMiddleware.js");

const rateLimit = require("express-rate-limit");

// ️ ป้องกัน Brute-force & Credential Stuffing สำหรับระบบ Auth
// นับเฉพาะ request ที่ล็อกอินผิดพลาด (status >= 400) เท่านั้น
// ล็อกอินสำเร็จจะไม่ถูกนับ → ใช้งานปกติไม่โดนบล็อก
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 นาที (ลดจาก 15 นาที ให้เหมาะสมขึ้น)
  max: process.env.NODE_ENV === "development" ? 1000 : 10, //  เพิ่ม Limit ในโหมด Dev เพื่อให้ Test ได้สะดวก
  skipSuccessfulRequests: true, //  ไม่นับ request ที่สำเร็จ (status < 400)
  message: {
    message: "คำขอเข้าสู่ระบบมากเกินไปจาก IP นี้ กรุณาลองใหม่ในอีก 5 นาที",
  },
});

const router = express.Router();

// ใช้ Limiter เฉพาะเส้นทางที่มีความเสี่ยงสูง
router.post("/requestpasswordreset", authLimiter, requestPasswordReset);
router.post("/resetpassword", authLimiter, resetPassword);

router.post("/auth", authLimiter, authUser);
router.post("/logout", logoutUser);

router.route("/").post(registerUser).get(protect, admin, getUsers);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.route("/shipping").put(protect, updateUserProfileShipping);
router
  .route("/:id")
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);
router.route("/:id/staff").put(protect, admin, updateUserStaff);

//   router.route('/').post(registerUser).get(protect, admin, getUsers)
// router
//   .route('/profile')
//   .get(protect, getUserProfile)
//   .put(protect, updateUserProfile)
// router.route('/shipping').put(protect, updateUserProfileShipping);
// router
//   .route('/:id')
//   .get(protect, admin, getUserById)
//   .put(protect, admin, updateUser)
// .delete(protect, admin, deleteUser)

module.exports = router;
