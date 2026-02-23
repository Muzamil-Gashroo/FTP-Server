const users = require('../models/user.model');

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const nodemailer = require("nodemailer");


const { v4: uuidv4 } = require('uuid');

const authController = {

    login: async (req, res, next) => {

        const { email, password } = req.body;

        try {

            const user = await users.findOne({ email });

            if (!user) {

                return res.status(400).json({ message: "Invalid credentials" });

            }

            const isMatch = await user.comparePassword(password);

            if (!isMatch) {

                return res.status(400).json({ message: "Invalid credentials" });

            }

            if (!user.isVerified) {
                return res.status(403).json({
                    message: "Please verify your email first"
                });
            }

            const token = jwt.sign(

                { userId: user.userID },

                process.env.JWT_SECRET,

                { expiresIn: "15m" }
            );

            const refreshToken = jwt.sign(
                { userId: user.userID },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: "7d" }
            );

            user.refreshToken = refreshToken;
            await user.save();


            res.json({

                message: "Login successful",
                userID: user.userID,
                token,
                refreshToken

            });

        } catch (error) {
            next(error);
        }

    },

    signup: async (req, res, next) => {

         const { name, email, password } = req.body;

        try {

        const existingUser = await users.findOne({ email });

        if (existingUser) {

            if (existingUser.isVerified) {
                return res.status(400).json({ message: "Email already in use" });
            }

            const verifyToken = crypto.randomBytes(32).toString("hex");

            existingUser.verificationToken = verifyToken;
            existingUser.verificationTokenExpiry = Date.now() + 1000 * 60 * 30; // 30 min

            await existingUser.save();

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const verificationLink =
                `${process.env.TEMP_PORT}/v1/auth/verify-email?token=${verifyToken}`;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: existingUser.email,
                subject: "Verify your email",
                html: `<p>Your previous verification expired.</p>
                       <a href="${verificationLink}">Verify Your Email</a>`
            });

            return res.status(200).json({
                message: "Verification email resent. Please verify your account."
            });
        }

        const userID = uuidv4();
        const user = new users({ userID, name, email, password });

        const verifyToken = crypto.randomBytes(32).toString("hex");
        user.verificationToken = verifyToken;
        user.verificationTokenExpiry = Date.now() + 1000 * 60 * 30;

        await user.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const verificationLink =
            `${process.env.TEMP_PORT}/v1/auth/verify-email?token=${verifyToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Verify your email",
            html: `<p>Click below to verify:</p>
                   <a href="${verificationLink}">Verify Your Email</a>`
        });

        res.status(201).json({ message: "User created successfully", userID });

      } catch (error) {
        next(error);
      }
    
    },

    emailVerify: async (req, res, next) => {

        try {

            const user = await users.findOne({
                verificationToken: req.query.token,
                verificationTokenExpiry: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ message: "Invalid or expired token" });
            }

            user.isVerified = true;
            user.verificationToken = undefined;
            user.verificationTokenExpiry = undefined;
            await user.save();

            res.send("Email verified , You can now login with your credentials");
        }
        catch (error) { next(error); }
    },

    getMe: async (req, res, next) => {
        try {
            const user = await users.findOne({ userID: req.userId }).select("-password");
            if (!user) return res.status(404).json({ message: "User not found" });

            const Subscription = require("../models/subscriptions.model");
            const sub = await Subscription.findOne({ userID: req.userId, status: "active" });

            res.json({
                user: user,
                subscription: sub ? { plan: sub.plan, key: sub.key, status: sub.status } : null
            });
        } catch (error) {
            next(error);
        }
    },

    refreshToken: async (req, res) => {

        try {

            const { refreshToken } = req.body;


            if (!refreshToken) {
                return res.status(401).json({ message: "Refresh token required" });
            }

            const user = await users.findOne({ refreshToken });

            if (!user) {
                return res.status(403).json({ message: "Invalid refresh token" });
            }

            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET,
                (err) => { if (err) { return res.status(403).json({ message: "Invalid refresh token" }); } }
            );

            const newAccessToken = jwt.sign(
                { userId: user.userID },
                process.env.JWT_SECRET,
                { expiresIn: "15m" }
            );

            const newRefreshToken = jwt.sign(
                { userId: user.userID },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: "7d" }
            );

            user.refreshToken = newRefreshToken;
            await user.save();

            res.json({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            });


        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    logout: async (req, res) => {

        try {

            const { refreshToken } = req.body;

            if (!refreshToken) {

                return res.status(400).json({ message: "Refresh token required" });
            }

            const user = await users.findOne({ refreshToken });

            if (!user) {
                return res.status(400).json({ message: "Invalid token" });
            }

            user.refreshToken = null;
            await user.save();

            res.json({ message: "Logged out successfully" });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    forgotPassword: async (req, res, next) => {

        try {

            const { email } = req.body;

            const user = await users.findOne({ email });

            if (!user) {
                return res.status(400).json({ message: "User not found" });
            }

            const resetToken = crypto.randomBytes(32).toString("hex");

            user.resetPasswordToken = resetToken;
            user.resetPasswordExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes

            await user.save();

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const resetLink = `${process.env.DOMAIN}/reset-password?token=${resetToken}`;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Reset your password",
                html: ` <p>Click below to reset your password:</p> <a href="${resetLink}">Reset Password</a> `
            });

            res.json({ message: "Password reset link sent to email" });

        } catch (error) {
            next(error);
        }
    },

    resetPassword: async (req, res, next) => {

        try {

            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({ message: "Token and new password are required" });
            }

            const user = await users.findOne({
                resetPasswordToken: token,
                resetPasswordExpiry: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ message: "Invalid or expired token" });
            }

            user.password = newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpiry = undefined;

            await user.save();

            res.json({ message: "Password reset successful" });

        } catch (error) {
            next(error);
        }
    },

    changePasword: async (req, res, next) => {

        try{
            
            const { oldPassword, newPassword } = req.body;
            const user = await users.findOne({ userID: req.userId });

            if (!user) { 
                return res.status(404).json({ message: "User not found" }); 
            }
            
            const isMatch = await user.comparePassword(oldPassword);
            
            if (!isMatch) { 
                return res.status(400).json({ message: "Current password is incorrect" }); 
               
            }
            
            user.password = newPassword;
            await user.save();
            res.json({ message: "Password changed successfully" });


        }catch(error){
            res.status(500).json({ message: error.message });
            next(error);
        }
    },


};

module.exports = authController