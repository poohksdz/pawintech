const express = require('express')
const router = express.Router()

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateReviewsProduct,
  updateShowFrontProduct,
  createProductReview,
} = require('../controllers/productController.js')

const { protect, admin, store } = require('../middleware/authMiddleware.js')
// const checkObjectId = require('../middleware/checkObjectId.js');

// Define routes
// router.route('/:id/datasheet', downloadProductDatasheet);
// router.route('/:id/manual', downloadProductManual);

router.route('/').get(getProducts).post(protect, store, createProduct)

// router.route('/:id/reviews').post(protect, checkObjectId, createProductReview);
// router.get('/top', getTopProducts);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, store, updateProduct)
  .delete(protect, store, deleteProduct)

router.route('/:id/reviews').post(protect, createProductReview)
router.route('/:id/showfront').put(protect, store, updateShowFrontProduct)

// router.route('/:id/datasheet', downloadProductDatasheet);
// router.route('/:id/manual', downloadProductManual);

// router.route('/').get(getProducts).post(protect, admin, createProduct);

// router.route('/:id/reviews').post(protect, checkObjectId, createProductReview);
// router.get('/top', getTopProducts);
// router
//   .route('/:id')
//   .get(checkObjectId, getProductById)
//   .put(protect, admin, checkObjectId, updateProduct)
//   .delete(protect, admin, checkObjectId, deleteProduct);

module.exports = router
