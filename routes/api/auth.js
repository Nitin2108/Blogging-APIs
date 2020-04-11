const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const { transporter,
  getPasswordResetURL,
  resetPasswordTemplate
}  = require('./modules/email');

const User = require('../../models/User');


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
 const sendPasswordResetEmail = async (email) => {
   
  console.log("I am here");
  
  console.log(email);
  
  

  
}





router.post('/reset-password/:email',async(req,res)=>
{
  try{
    const { email } = req.params;
    console.log(email);
    let user;
 
    user = await User.findOne({ email });
    
     if(!user)
     return res.status(404).send("No user with that email")

  const token = usePasswordHashToMakeToken(user)
  const url = getPasswordResetURL(user, token)
  const emailTemplate = resetPasswordTemplate(user, url)
  const sendEmail = () => {
    transporter.sendMail(emailTemplate, (err, info) => {
      console.log(info);
      if (err) {
         return res.status(500).send("Error sending Mail")
      }
       return res.status(200).send(`Email sent`)
    })
  }
  sendEmail()
    
}
  catch(err){
   return err;
  }
});

router.post('/receive_new_password/:email/:token',async(req,res)=>
{
  try{
    
    const { email, token } = req.params
    const { password } = req.body


    User.findOne({ email : email })

    .then(user => {
     console.log("user found")
      const secret = user.password;
      const payload = jwt.decode(token, secret)
      
      if (payload.email === user.email) {
        bcrypt.genSalt(10, function(err, salt) {
          if (err) return
          bcrypt.hash(password, salt, function(err, hash) {
            if (err) return
            User.findOneAndUpdate({ email: email }, { password: hash })
              .then(() => res.status(200).send("Password has been changed"))
              .catch(err => res.status(500).send(err))
          })
        })
      }
    })


    .catch(() => {
      res.status(404).json("User not found")
    })

    
}
  catch(err){
    console.log(err);
  }
});

// @route    GET api/auth
// @desc     Get user by token
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
          email: user.email
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);


module.exports = router;
