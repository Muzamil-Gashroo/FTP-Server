const Subscription = require("../models/subscriptions.model");

const apiKeyMiddleware = async (req, res, next) => {

  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({ message: "API key missing" });
    }

    const subscription = await Subscription.findOne({
      key: apiKey,
      status: "active",
      plan: "premium",
    });

    if (!subscription) {
      return res.status(401).json({ message: "Invalid or inactive API key" });
    }

    req.userId = subscription.userID;
    next();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = apiKeyMiddleware;
