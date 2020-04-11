
const nodemailer = require('nodemailer');

 const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_LOGIN || 'yourcompanyemail',
    pass: process.env.EMAIL_PASSWORD || 'password'
  }
})

 const getPasswordResetURL = (user, token) =>
  `http://localhost:5000/password/reset/${user.email}/${token}`

 const resetPasswordTemplate = (user, url) => {
  const from = process.env.EMAIL_LOGIN
  const to = user.email
  const subject = "🌻 Blog Website Password Reset 🌻"
  const html = `
  <p>Hey ${user.name || user.email},</p>
  <p>We heard that you lost your Blog website password. Sorry about that!</p>
  <p>But don’t worry! You can use the following link to reset your password:</p>
  <a href=${url}>${url}</a>
  <p>If you don’t use this link within 1 hour, it will expire.</p>
  
  `

  return { from, to, subject, html }
}
module.exports ={transporter, getPasswordResetURL, resetPasswordTemplate};