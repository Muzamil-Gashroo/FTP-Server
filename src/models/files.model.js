const mongoose = require('mongoose');
const User = require('./user.model');

const fileSchema = new mongoose.Schema({
  
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