const express = require("express");
const router = express.Router();

const {
  getServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
  updateShowFrontService,
} = require("../controllers/serviceController.js");

const { protect, admin } = require("../middleware/authMiddleware.js");

router.route("/").get(getServices).post(protect, admin, createService);
router
  .route("/:id")
  .get(getServiceById)
  .put(protect, admin, updateService)
  .delete(protect, admin, deleteService);
router.route("/:id/showfront").put(updateShowFrontService);

module.exports = router;
