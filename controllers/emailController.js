const nodemailer = require("nodemailer");
const asyncHandler = require("../middleware/asyncHandler.js");
const db = require("../config/db.js");
// @desc    Get all emails
// @route   GET /api/email
// @access  Private
const getAllEmails = asyncHandler(async (req, res) => {
  try {
    const query = "SELECT * FROM emails ORDER BY created_at DESC";
    const [emails] = await db.pool.query(query);

    res.status(200).json({ emails });
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ message: "Error fetching emails" });
  }
});

// @desc    Send email and store in database
// @route   POST /api/email
// @access  Public
const sendEmail = asyncHandler(async (req, res) => {
  const { username, email, phone, subject, message } = req.body;

  if (!email || !subject || !message) {
    return res
      .status(400)
      .json({ message: "Email, subject, and message are required" });
  }

  try {
    const transporter = nodemailer.createTransport(
      process.env.EMAIL_HOST
        ? {
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
        : {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }
    );

    const mailOptions = {
      from: `"pawin-tech.com" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);

    const query = `
        INSERT INTO emails (username, email, phone, subject, message, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
    await db.pool.query(query, [username, email, phone, subject, message]);

    res.status(200).json({ message: "Email sent and stored successfully" });
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Error sending email", error: error.message });
    }
  }
});

module.exports = { getAllEmails, sendEmail };
