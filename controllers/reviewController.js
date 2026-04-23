const asyncHandler = require("../middleware/asyncHandler");
const { pool } = require("../config/db.js");

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    try {
        // Get reviews with user names
        const [reviews] = await pool.query(`
            SELECT 
                pr._id,
                pr.product_id,
                pr.user_id,
                pr.rating,
                pr.comment,
                pr.created_at,
                u.name as user_name
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u._id
            WHERE pr.product_id = ?
            ORDER BY pr.created_at DESC
        `, [productId]);

        // Get average rating and count
        const [stats] = await pool.query(`
            SELECT 
                COALESCE(AVG(rating), 0) as avgRating,
                COUNT(*) as numReviews
            FROM product_reviews
            WHERE product_id = ?
        `, [productId]);

        res.status(200).json({
            reviews,
            avgRating: parseFloat(stats[0].avgRating) || 0,
            numReviews: parseInt(stats[0].numReviews) || 0
        });
    } catch (error) {
        console.error(`Error fetching reviews: ${error.message}`);
        res.status(500).json({ message: "Error fetching reviews" });
    }
});

// @desc    Create a product review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
    }

    if (!productId) {
        res.status(400);
        throw new Error("Product ID is required");
    }

    try {
        // Check if product exists
        const [products] = await pool.query(
            "SELECT _id FROM products WHERE _id = ?",
            [productId]
        );

        if (products.length === 0) {
            res.status(404);
            throw new Error("Product not found");
        }

        // Check if user already reviewed this product
        const [existingReviews] = await pool.query(
            "SELECT _id FROM product_reviews WHERE product_id = ? AND user_id = ?",
            [productId, userId]
        );

        if (existingReviews.length > 0) {
            res.status(400);
            throw new Error("You have already reviewed this product");
        }

        // Insert the review
        const [result] = await pool.query(
            "INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
            [productId, userId, rating, comment || ""]
        );

        // Get the inserted review with user name
        const [newReview] = await pool.query(`
            SELECT 
                pr._id,
                pr.product_id,
                pr.user_id,
                pr.rating,
                pr.comment,
                pr.created_at,
                u.name as user_name
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u._id
            WHERE pr._id = ?
        `, [result.insertId]);

        // Update product's rating and numReviews
        const [stats] = await pool.query(`
            SELECT 
                COALESCE(AVG(rating), 0) as avgRating,
                COUNT(*) as numReviews
            FROM product_reviews
            WHERE product_id = ?
        `, [productId]);

        await pool.query(
            "UPDATE products SET rating = ?, numReviews = ? WHERE _id = ?",
            [stats[0].avgRating, stats[0].numReviews, productId]
        );

        res.status(201).json({
            message: "Review added successfully",
            review: newReview[0]
        });
    } catch (error) {
        console.error(`Error creating review: ${error.message}`);
        res.status(error.status || 500).json({
            message: error.message || "Error creating review"
        });
    }
});

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private (owner only)
const updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
        res.status(400);
        throw new Error("Rating must be between 1 and 5");
    }

    try {
        // Check if review exists and belongs to user
        const [reviews] = await pool.query(
            "SELECT * FROM product_reviews WHERE _id = ?",
            [reviewId]
        );

        if (reviews.length === 0) {
            res.status(404);
            throw new Error("Review not found");
        }

        const review = reviews[0];

        if (review.user_id !== userId && !req.user.isAdmin) {
            res.status(403);
            throw new Error("Not authorized to update this review");
        }

        // Update the review
        await pool.query(
            "UPDATE product_reviews SET rating = ?, comment = ? WHERE _id = ?",
            [rating, comment || "", reviewId]
        );

        // Update product's rating and numReviews
        const [stats] = await pool.query(`
            SELECT 
                COALESCE(AVG(rating), 0) as avgRating,
                COUNT(*) as numReviews
            FROM product_reviews
            WHERE product_id = ?
        `, [review.product_id]);

        await pool.query(
            "UPDATE products SET rating = ?, numReviews = ? WHERE _id = ?",
            [stats[0].avgRating, stats[0].numReviews, review.product_id]
        );

        // Get updated review with user name
        const [updatedReview] = await pool.query(`
            SELECT 
                pr._id,
                pr.product_id,
                pr.user_id,
                pr.rating,
                pr.comment,
                pr.created_at,
                u.name as user_name
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u._id
            WHERE pr._id = ?
        `, [reviewId]);

        res.status(200).json({
            message: "Review updated successfully",
            review: updatedReview[0]
        });
    } catch (error) {
        console.error(`Error updating review: ${error.message}`);
        res.status(error.status || 500).json({
            message: error.message || "Error updating review"
        });
    }
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (owner or admin)
const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user._id;

    try {
        // Check if review exists
        const [reviews] = await pool.query(
            "SELECT * FROM product_reviews WHERE _id = ?",
            [reviewId]
        );

        if (reviews.length === 0) {
            res.status(404);
            throw new Error("Review not found");
        }

        const review = reviews[0];

        // Check if user is owner or admin
        if (review.user_id !== userId && !req.user.isAdmin) {
            res.status(403);
            throw new Error("Not authorized to delete this review");
        }

        // Delete the review
        await pool.query("DELETE FROM product_reviews WHERE _id = ?", [reviewId]);

        // Update product's rating and numReviews
        const [stats] = await pool.query(`
            SELECT 
                COALESCE(AVG(rating), 0) as avgRating,
                COUNT(*) as numReviews
            FROM product_reviews
            WHERE product_id = ?
        `, [review.product_id]);

        await pool.query(
            "UPDATE products SET rating = ?, numReviews = ? WHERE _id = ?",
            [stats[0].avgRating, stats[0].numReviews, review.product_id]
        );

        res.status(200).json({
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error(`Error deleting review: ${error.message}`);
        res.status(error.status || 500).json({
            message: error.message || "Error deleting review"
        });
    }
});

// @desc    Get user's reviews for a product
// @route   GET /api/reviews/user/product/:productId
// @access  Private
const getUserReviewForProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        const [reviews] = await pool.query(
            "SELECT * FROM product_reviews WHERE product_id = ? AND user_id = ?",
            [productId, userId]
        );

        res.status(200).json({
            hasReview: reviews.length > 0,
            review: reviews.length > 0 ? reviews[0] : null
        });
    } catch (error) {
        console.error(`Error fetching user review: ${error.message}`);
        res.status(500).json({ message: "Error fetching user review" });
    }
});

module.exports = {
    getProductReviews,
    createReview,
    updateReview,
    deleteReview,
    getUserReviewForProduct
};