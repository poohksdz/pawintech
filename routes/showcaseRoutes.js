const express = require("express");
const router = express.Router();

const {
  getShowcases,
  getShowcaseById,
  createShowcase,
  updateShowcase,
  deleteShowcase,
  updateOrderPresentShowcase,
} = require("../controllers/showcaseController.js");

const { protect, admin } = require("../middleware/authMiddleware.js");

// Define routes
router.route("/").get(getShowcases).post(protect, admin, createShowcase);
router
  .route("/:id")
  .get(getShowcaseById)
  .put(protect, admin, updateShowcase)
  .delete(protect, admin, deleteShowcase);

router
  .route("/orderpresent/:id")
  .put(protect, admin, updateOrderPresentShowcase);

module.exports = router;
