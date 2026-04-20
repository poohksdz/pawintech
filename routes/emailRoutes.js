const express = require("express");
const {
  getAllEmails,
  sendEmail,
} = require("../controllers/emailController.js");

const { protect, admin } = require("../middleware/authMiddleware.js");

const router = express.Router();

// Admin only: send emails and view email list
router.post("/", protect, admin, sendEmail);
router.get("/", protect, admin, getAllEmails);

module.exports = router;
