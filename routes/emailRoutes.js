const express = require('express')
const { getAllEmails, sendEmail } = require('../controllers/emailController.js')

const { protect, admin } = require('../middleware/authMiddleware.js')

const router = express.Router()

router.post('/', sendEmail)
router.get('/', getAllEmails)
// router.get('/getallemails', protect, admin, getAllEmails)

module.exports = router
