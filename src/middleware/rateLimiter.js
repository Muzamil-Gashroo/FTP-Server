
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    limit: 50, // Limit each IP to 50 requests per windowMs
    message: {
        message: "Too many login attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    limit: 100,
    message: {
        message: "Too many requests from this IP, please try again later"
    }
});

module.exports = { authLimiter, apiLimiter };
