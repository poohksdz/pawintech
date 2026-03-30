const express = require("express");
const router = express.Router();
const {
  createOrderPCB,
  createOrderPCBbyAdmin,
  getMyOrders,
  getOrders,
  getOrderById,
  getOrderPCBByorderID,
  getOwnShippingRates,
  updateShippingRates,
  verifyPaymentPCB,
  updateDeliveryPCB,
  updateOrderPCB,
  deleteOrderPCB,
  getOrderPCBByorderpaymentID,
} = require("../controllers/orderpcbController.js");
const { protect, admin } = require("../middleware/authMiddleware.js");

// Routes
router.route("/").post(createOrderPCB).get(protect, admin, getOrders);

router
  .route("/createorderpcbbyadmin")
  .post(protect, admin, createOrderPCBbyAdmin);
router.route("/myorders").get(protect, getMyOrders);
router.route("/byorderid/:orderID").get(protect, getOrderPCBByorderID);
router.route("/byorderpayid/:id").get(protect, getOrderPCBByorderpaymentID);

router.route("/getownshippingrates").get(protect, getOwnShippingRates);
router.route("/shippingrates").put(protect, admin, updateShippingRates);

// ต้องอยู่ล่างสุดเสมอ เพื่อไม่ให้ไปทับกับ /myorders หรือ /byorderid
router
  .route("/:id")
  .get(protect, getOrderById)
  .put(protect, admin, updateOrderPCB)
  .delete(protect, admin, deleteOrderPCB);

router.route("/:id/verify-payment").put(protect, admin, verifyPaymentPCB);
router.route("/:id/deliver").put(protect, admin, updateDeliveryPCB);

module.exports = router;

module.exports = router;
