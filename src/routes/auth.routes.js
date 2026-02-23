const express = require("express");
const authController = require("../controllers/auth.controller");
const authCheck = require("../middleware/auth.middleware");

const authLimiter = require("../middleware/rateLimiter");

const router = express.Router();

// authLimiter
router.post("/signup", authController.signup);
// authLimiter
router.post("/login", authController.login);
// authLimiter
router.post("/refresh", authController.refreshToken);
// authLimiter
router.post("/forgot-password", authController.forgotPassword);
//authLimiter
router.post("/change-password", authCheck, authController.changePasword);

router.post("/logout", authController.logout);
router.get("/me", authCheck, authController.getMe);


router.post("/reset-password", authController.resetPassword);
router.get("/verify-email", authController.emailVerify);

module.exports = router;