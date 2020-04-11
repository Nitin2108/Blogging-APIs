const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  '/',
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('mobilenumber','please enter mobile number').isMobilePhone()
        .not()
        .isEmpty(),
    check('gender','please select gender')
        .not()
        .isEmpty(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, mobilenumber, gender,avatar,x } = req.body;


    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      //const avatar = gravatar.url(email, {
        //s: '200',
        //r: 'pg',
        //d: 'mm'
      //});

      user = new User({
        name,
        email,
        mobilenumber,
        gender,
        avatar,
        password,x
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
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

// @route    PUT api/users/subscribe/:id
// @desc     Subscribe a blogger
// @access   Private

router.put('/subscribe/:email', auth, async (req, res) => {
  try {
    
    const user = await User.findOne({email:req.user.email}).select('-password');;
    console.log(user);
    if (
      user.subscribers.filter(s => s.user.toString() === req.params.email).length > 0
    ) {
      return res.status(400).json({ msg: 'Blogger already subscribed' });
    }


    // Check if the user has already been subscribed
    const newSubscriber = {
      
      user: req.params.email
    };

   
     user.subscribers.push(newSubscriber);
     console.log(user);
    await user.save();
    

    res.json(user.subscribers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/users/unsubscribe/:id
// @desc     Unsubscribe a blogger
// @access   Private
router.put('/unsubscribe/:email', auth, async (req, res) => {
  try {
    const user = await User.findOne({email:req.user.email});

    // Check if the user has already been subscribed
    if (
      user.subscribers.filter(s => s.user.toString() === req.params.email).length === 0
    ) {
      return res.status(400).json({ msg: 'User has not yet been subscribed' });
    }

    // Get remove index
    const removeIndex = user.subscribers
      .map(s => s.user.toString())
      .indexOf(req.user.email);

    user.subscribers.splice(removeIndex, 1);

    await user.save();

    res.json(user.subscribers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/users/deactivate/:id
// @desc     deActivate user by ID
// @access   Private
router.put('/deactivate/:email', auth, async (req, res) => {
  try {
    const user = await await User.findOne({email:req.params.email});
     
    
    
    user.isActive=false;
    await user.save;
    console.log(user);

    res.json(user);
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});


// @route    GET api/users/activate/:id
// @desc     Activate user by ID
// @access   Private
router.put('/activate/:email', auth, async (req, res) => {
  try {
    const user = await await User.findOne({email:req.params.email});
     
    
    
    user.isActive=true;
    await user.save;
    console.log(user);

    res.json(user);
  } catch (err) {
    console.error(err.message);

    res.status(500).send('Server Error');
  }
});

// @route    GET api/users
// @desc     Get all users
// @access   Public
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');;
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
