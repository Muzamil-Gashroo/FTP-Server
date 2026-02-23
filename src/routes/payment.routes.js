const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/stripe_controllers/payment.controller");
const authCheck = require("../middleware/auth.middleware");

router.post("/create-session", authCheck, paymentsController.createCheckoutSession);


module.exports = router;
