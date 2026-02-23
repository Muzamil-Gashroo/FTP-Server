const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({

  userID: { 
    type: String, 
    required: true, 
    ref: "User",
    unique: true 
  },
  
  plan: {
    type: String,
    enum: ["basic", "premium"],
    default: "basic",
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive"
  },

  key: {
    type: String,
    required: true,
    unique: true
  },

}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
