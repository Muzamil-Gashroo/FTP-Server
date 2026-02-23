const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const Subscriptions = require("../../models/subscriptions.model");
const Payments = require("../../models/payments.model");
const crypto = require("crypto");

const webhookController = {

  handleStripeWebhook: async (req, res) => {

    const sig = req.headers["stripe-signature"];
    let event;

    try {

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(" Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {

      console.log(" Stripe Event:", event.type);

      if (event.type === "checkout.session.completed") {

        const session = event.data.object;

        const userID = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const paymentID = session.metadata?.PaymentID;
        const stripeSubscriptionId = session.subscription;
        const stripeCustomerId = session.customer;

        if (!userID || !plan || !paymentID) {
          console.error(" Missing metadata in session");
          return res.json({ received: true });
        }

        //  (Uncomment in production)
        /*
        if (session.payment_status !== "paid") {
          console.error(" Payment not completed.");
          return res.json({ received: true });
        }
        */

        const paymentRecord = await Payments.findOne({ paymentID });

        if (!paymentRecord) {
          console.error(" PaymentID record not found:", paymentID);
          return res.json({ received: true });
        }

        if (paymentRecord.status === "completed") {
          console.log(" Payment already processed. Skipping:", paymentID);
          return res.json({ received: true });
        }

        if (
          paymentRecord.userID !== userID ||
          paymentRecord.plan !== plan
        ) {

          paymentRecord.status = "failed";
          await paymentRecord.save();

          console.error(" Metadata mismatch for payment:", paymentID);
          return res.json({ received: true });
        }
          
          paymentRecord.stripeSubscriptionId = stripeSubscriptionId;
          paymentRecord.stripeCustomerId = stripeCustomerId;
          paymentRecord.status = "completed";
          await paymentRecord.save();

        console.log(" Payment marked completed:", paymentID);

        let subscription = await Subscriptions.findOne({ userID });

        if (subscription) {

          subscription.plan = plan;
          subscription.status = "active";

          if (!subscription.key) {
            subscription.key = crypto.randomBytes(24).toString("hex");
          }

          await subscription.save();

          console.log(" Subscription updated for:", userID);

        } else {

          await Subscriptions.create({
            userID,
            plan,
            status: "active",
            key: crypto.randomBytes(24).toString("hex")
          });

          console.log(" Subscription created for:", userID);
        }
      }

      if (event.type === "customer.subscription.deleted") {

        const subscriptionObj = event.data.object;
        const stripeSubId = subscriptionObj.id;

        console.log(" Subscription cancelled:", stripeSubId);

        // If you later store stripeSubscriptionId in DB,
        // you can mark subscription inactive here.
      }

      return res.json({ received: true });

    } catch (error) {
      console.error(" Webhook processing error:", error);
      return res.json({ received: true }); // Always return 200 to Stripe
    }
  }

};

module.exports = webhookController;