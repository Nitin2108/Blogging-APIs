const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../../../models/User');
const { transporter,
    getPasswordResetURL,
    resetPasswordTemplate
}  = require('../../modules/email');

// `secret` is passwordHash concatenated with user's createdAt,
// so if someones gets a user token they still need a timestamp to intercept.

 const usePasswordHashToMakeToken = ({
  password: passwordHash,
  email: email,
  
}) => {
  const secret = passwordHash;
  const token = jwt.sign({ email }, secret, {
    expiresIn: 3600 // 1 hour
  })
  return token
}

/*** Calling this function with a registered user's email sends an email IRL ***/
/*** I think Nodemail has a free service specifically designed for mocking   ***/
 const sendPasswordResetEmail = async (req, res) => {
   
  console.log("I am here");
  const { email } = req.params
  console.log(email);
  let user
  try {
    user = await User.findOne({ email }).exec()
  } catch (err) {
    res.status(404).json("No user with that email")
  }
  const token = usePasswordHashToMakeToken(user)
  const url = getPasswordResetURL(user, token)
  const emailTemplate = resetPasswordTemplate(user, url)

  const sendEmail = () => {
    transporter.sendMail(emailTemplate, (err, info) => {
      if (err) {
        res.status(500).json("Error sending email")
      }
      console.log(`** Email sent **`, info.response)
    })
  }
  sendEmail()
}

 const receiveNewPassword = (req, res) => {
  const { email, token } = req.params
  const { password } = req.body

  User.findOne({ email: email })

    .then(user => {
      const secret = user.password;
      const payload = jwt.decode(token, secret)
      if (payload.email === user.id) {
        bcrypt.genSalt(10, function(err, salt) {
          if (err) return
          bcrypt.hash(password, salt, function(err, hash) {
            if (err) return
            User.findOneAndUpdate({ email: email }, { password: hash })
              .then(() => res.status(202).json("Password changed accepted"))
              .catch(err => res.status(500).json(err))
          })
        })
      }
    })

    .catch(() => {
      res.status(404).json("Invalid user")
    })
}

module.exports = {usePasswordHashToMakeToken,sendPasswordResetEmail,receiveNewPassword};