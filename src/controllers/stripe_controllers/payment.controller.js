const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Payment = require("../../models/payments.model");
const crypto = require("crypto");


const paymentController = {

  createCheckoutSession: async (req, res) => {

    try {

      const { plan } = req.body;
      const userId = req.userId;
      console.log("Creating checkout session for user:", userId, "with plan:", plan);
      const priceMap = {
        
        premium: process.env.STRIPE_PREMIUM_PRICE_ID,
      
      };
       
      if (!priceMap[plan]) {
          return res.status(400).json({ message: "Invalid plan" });
        }
      const PaymentID = crypto.randomBytes(16).toString("hex");

      const newPayment = new Payment({
      
        userID: userId, plan: plan, paymentID: PaymentID , status: 'pending'
      
      });

      await newPayment.save();

      const session = await stripe.checkout.sessions.create({
        
        mode: "subscription",
        payment_method_types: ["card"],
        
        line_items: [
          {
            price: priceMap[plan],
            quantity: 1
          }
        ],

        success_url: `${process.env.DOMAIN}/dashboard?success=true`,
        cancel_url: `${process.env.DOMAIN}/dashboard?canceled=true`,
        
        metadata: {
          userId,
          plan,
          PaymentID,
        }
        
      }, { idempotencyKey: PaymentID } );


      newPayment.stripeSessionId = session.id;
      await newPayment.save();
      
      res.json({ url: session.url });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

};

module.exports = paymentController;
