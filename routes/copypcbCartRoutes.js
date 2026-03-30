const express = require("express");
const router = express.Router();

//  Import Controller
const {
  getcopyCartPCBs,
  getcopyCartPCBById,
  createcopyCartPCB,
  updatecopyCartPCB,
  deletecopyCartPCB,
  getcopyCartPCBByUserId,
  updateAmountcopyCartPCBById,
  updateStatuscopyCartPCBById,
  updateShippingcopyCartPCBById,
  uploadMultipleImages,
  uploadFile,
} = require("../controllers/copypcbCartController.js");

const { protect, admin } = require("../middleware/authMiddleware.js");
const upload = require("../middleware/uploadMiddleware.js");

//  Route สำหรับ Upload
router.post(
  "/upload/multipleimages",
  upload.array("images", 10),
  uploadMultipleImages,
);

//  แก้ตรงนี้ครับ! ใช้ชื่อ 'copypcbZip' ให้ตรงกับที่เห็นในรูป
router.post("/upload/upload-zip", upload.single("copypcbZip"), uploadFile);

// Routes ปกติ
router
  .route("/")
  .post(protect, createcopyCartPCB)
  .get(protect, admin, getcopyCartPCBs);

router.get("/user/:userId", protect, getcopyCartPCBByUserId);
router.put("/amount/:id", protect, updateAmountcopyCartPCBById);
router.put("/status/:id", protect, admin, updateStatuscopyCartPCBById);
router.put("/shippingrates/:id", protect, updateShippingcopyCartPCBById);

router
  .route("/:id")
  .get(protect, getcopyCartPCBById)
  .put(protect, admin, updatecopyCartPCB)
  .delete(protect, admin, deletecopyCartPCB);

module.exports = router;
