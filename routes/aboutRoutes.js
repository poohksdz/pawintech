const express = require("express");
const router = express.Router();

const {
  getAbouts,
  getAboutById,
  createAbout,
  updateAbout,
  deleteAbout,
} = require("../controllers/aboutController");

const { protect } = require("../middleware/authMiddleware.js");

// Define routes
router.route("/").get(getAbouts).post(protect, createAbout);
router.route("/:ID").get(getAboutById).put(protect, updateAbout).delete(protect, deleteAbout);

module.exports = router;
