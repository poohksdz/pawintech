const asyncHandler = require("../middleware/asyncHandler.js");
const path = require("path");
const fs = require("fs");

// @desc    Upload payment slip image
// @route   POST /api/paymentSlipImages
// @access  Private
const uploadPaymentSlipImage = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error("No image file uploaded");
    }

    // Return the path to the uploaded file
    const imagePath = `/paymentSlipImages/${req.file.filename}`;

    res.json({ image: imagePath });
});

module.exports = {
    uploadPaymentSlipImage,
};
