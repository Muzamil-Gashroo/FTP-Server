

const authRoutes = require("./routes/auth.routes");
const paymentRoutes = require("./routes/payment.routes");
const webhookController = require("./controllers/stripe_controllers/stripeWebhook.controller");
const filesRoutes = require("./routes/files.routes");
const connectDB = require("./connections/db.connection");

const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 8080;
const app = express();

connectDB();

app.use(cors({
  origin: [
    process.env.DOMAIN,
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  credentials: true
}));
app.options('*', cors());


app.post("/v1/webhooks/stripe", express.raw({ type: "application/json" }), webhookController.handleStripeWebhook);

app.use(express.json());
app.use("/public", express.static("public"));


// Auth 
app.use("/v1/auth", authRoutes);

// Payments (JWT)
app.use("/v1/payments", paymentRoutes);

// Files (JWT - Dashboard) 
app.use("/v1/files", filesRoutes);

// health check
app.use("/", (__, res) => { res.status(200).send(" Works Fine :) "); });

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large (max 50MB)"
    });
  }

  res.status(500).json({
    message: err.message || "Something went wrong"
  });
});



module.exports = app;
