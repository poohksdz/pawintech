const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    getUserReviewForProduct
} = require("../controllers/reviewController");

// @route   GET /api/reviews/product/:productId
// @desc    Get all reviews for a product
// @access  Public
router.get("/product/:productId", getProductReviews);

// @route   POST /api/reviews
// @desc    Create a product review
// @access  Private
router.post("/", protect, createReview);

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private
router.put("/:reviewId", protect, updateReview);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete("/:reviewId", protect, deleteReview);

// @route   GET /api/reviews/user/product/:productId
// @desc    Get user's review for a product
// @access  Private
router.get("/user/product/:productId", protect, getUserReviewForProduct);

module.exports = router;