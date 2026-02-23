const mongoose = require('mongoose');


const paymentSchema = new mongoose.Schema({

    userID: {

        type: String,
        required: true,
        ref: 'User'

    },
    plan: {

        type: String,
        required: true

    },
    paymentID: {

        type: String,
        required: true,
        unique: true

    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
    stripeSessionId: {
         type: String
    },
    stripeSubscriptionId: {
         type: String
    },
    stripeCustomerId: {
         type: String
    },

}, {timestamps: true} );

module.exports = mongoose.model('Payment', paymentSchema);