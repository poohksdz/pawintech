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
// const checkObjectId = require('../middleware/checkObjectId.js');

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

// router.route('/').get(getShowcases).post(protect, admin, createShowcase);
// router
//   .route('/:id')
//   .get(checkObjectId, getShowcaseById)
//   .put(protect, admin, checkObjectId, updateShowcase)
//   .delete(protect, admin, checkObjectId, deleteShowcase);

module.exports = router;
