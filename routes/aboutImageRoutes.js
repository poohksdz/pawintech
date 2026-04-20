const express = require("express");
const router = express.Router();

const {
  getAboutImages,
  getAboutImageById,
  createAboutImage,
  updateAboutImage,
  updateShowFrontAboutImage,
  deleteAboutImage,
} = require("../controllers/aboutImageController.js");

const {
  protect,
  staff,
  admin,
  store,
} = require("../middleware/authMiddleware.js");

// Define routes
router.route("/showfront").put(updateShowFrontAboutImage);

router
  .route("/:ID")
  .get(getAboutImageById)
  .put(updateAboutImage)
  .delete(deleteAboutImage);

router.route("/").get(getAboutImages).post(createAboutImage);

module.exports = router;
