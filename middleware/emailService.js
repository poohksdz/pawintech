const nodemailer = require('nodemailer')

// Function to send an email
const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      from: `"Your App Name"`,
      // from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    }

    const info = await transporter.sendMail(mailOptions)
    // console.log(`Email sent: ${info.messageId}`)
  } catch (error) {
    console.error(`Error sending email: ${error.message}`)
    throw new Error('Email could not be sent')
  }
}

module.exports = { sendEmail }

// const nodemailer = require('nodemailer')

// // Create a function to send email
// const sendEmail = async ({ to, subject, text }) => {
//   try {
//     // Configure Nodemailer transporter
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com', // SMTP server (e.g., Gmail)
//       port: 587, // Port for TLS
//       secure: false, // Set to true for port 465, false for 587
//       auth: {
//         user: process.env.EMAIL_USER, // Your email address
//         pass: process.env.EMAIL_PASS, // Your email app password
//       },
//     })

//     // Mail options
//     const mailOptions = {
//       from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Sender address
//       to, // Recipient address (user's email)
//       subject, // Subject line
//       text, // Plain text body
//     }

//     // Send the email
//     const info = await transporter.sendMail(mailOptions)

//     console.log(`Email sent: ${info.messageId}`)
//   } catch (error) {
//     console.error(`Error sending email: ${error.message}`)
//     throw new Error('Email could not be sent')
//   }
// }

// module.exports = { sendEmail }
