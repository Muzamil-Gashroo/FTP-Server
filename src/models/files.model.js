const mongoose = require('mongoose');
const User = require('./user.model');

const fileSchema = new mongoose.Schema({
  // userId now corrected to userID to match the field in the User model
  userID: {
    type: String,
    ref: 'User',
    required: true
  },
  fileId: {
    type: String,
    required: true,
    unique: true
  },
  filename: String,
  folder: String,
  type: String,
  displayName: {
    type: String,
    default: null
  },
  size: Number,

}, { timestamps: true });

module.exports = mongoose.model('Files', fileSchema);