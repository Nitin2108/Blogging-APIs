const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  mobilenumber:{
    type: Number,
    required: true
  },
  gender:{
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  isActive:{
    type: Boolean,
    default: true
 },
  date: {
    type: Date,
    default: Date.now
  },
  x:{
    type: String,
  },
  subscribers: [
    {
      user: {
        type: String
      }
    }
  ]
});

module.exports = User = mongoose.model('user', UserSchema);
