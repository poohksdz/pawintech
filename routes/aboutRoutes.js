const express = require('express')
const router = express.Router()

const {
  getAbouts,
  getAboutById,
  createAbout,
  updateAbout,
  deleteAbout,
} = require('../controllers/aboutController')

const {
  protect,
  staff,
  admin,
  store,
} = require('../middleware/authMiddleware.js')
// const checkObjectId = require('../middleware/checkObjectId.js');

// Define routes

router.route('/').get(getAbouts).post(createAbout)

router.route('/:ID').get(getAboutById).put(updateAbout).delete(deleteAbout)

// router.route('/').get(getAbouts).post(protect, staff, createAbout)

// router
//   .route('/:id')
//   .get(getAboutById)
//   .put(protect, staff, updateAbout)
//   .delete(protect, staff, deleteAbout)
// router.route('/:id/showfront').put(updateShowFrontAbout)

module.exports = router
