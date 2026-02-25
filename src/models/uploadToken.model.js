const mongoose = require("mongoose");

const uploadTokenSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

uploadTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("UploadToken", uploadTokenSchema);