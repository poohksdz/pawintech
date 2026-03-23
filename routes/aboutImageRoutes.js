const express = require('express')
const router = express.Router()

const {
  getAboutImages,
  getAboutImageById,
  createAboutImage,
  updateAboutImage,
  updateShowFrontAboutImage,
  deleteAboutImage,
} = require('../controllers/aboutImageController.js')

const {
  protect,
  staff,
  admin,
  store,
} = require('../middleware/authMiddleware.js')
// const checkObjectId = require('../middleware/checkObjectId.js');

// Define routes
router.route('/showfront').put(updateShowFrontAboutImage)

router
  .route('/:ID')
  .get(getAboutImageById)
  .put(updateAboutImage)
  .delete(deleteAboutImage)

router.route('/').get(getAboutImages).post(createAboutImage)

// router.route('/').get(getAboutImages).post(protect, staff, createAboutImage)

// router
//   .route('/:ID')
//   .get(getAboutImageByID)
//   .put(protect, staff, updateAboutImage)
//   .delete(protect, staff, deleteAboutImage)
// router.route('/:ID/showfront').put(updateShowFrontAboutImage)

module.exports = router
