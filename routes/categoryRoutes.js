const express = require('express')
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryDetails,
} = require('../controllers/categoryController.js')
const { protect, store, admin } = require('../middleware/authMiddleware.js')

const router = express.Router()

router.route('/').post(protect, store, createCategory).get(getCategories)
router
  .route('/:id')
  .get(getCategoryDetails)
  .delete(protect, store, deleteCategory)
  .put(protect, store, updateCategory)

// router
//   .route('/')
//   .post(protect, admin, createCategory)
//   .get(protect, admin, getCategorys);
// router
//   .route('/:id')
//   .get(protect, admin, getCategoryDetails)
//   .delete(protect, admin, deleteCategory)
//   .put(protect, admin, updateCategory);

module.exports = router
