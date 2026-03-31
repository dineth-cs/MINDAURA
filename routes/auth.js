const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Create a new user
        user = new User({
            name,
            email,
            password: hashedPassword,
        });

        // Save user to the database
        await user.save();

        // Generate JWT token for auto-login
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({ token, user, message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Compare password
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            dateOfBirth: user.dateOfBirth,
            age: user.age,
            token
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP and expiration (10 mins)
        user.resetPasswordOtp = otp;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your password reset OTP is ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "OTP sent to email successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Verify OTP Route
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.resetPasswordOtp !== otp || user.resetPasswordExpire < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        res.status(200).json({ message: "OTP verified successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify OTP again for security
        if (user.resetPasswordOtp !== otp || user.resetPasswordExpire < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Hash the new password
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        user.password = hashedPassword;

        // Clear OTP fields
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get User Profile Route
router.get('/profile', async (req, res) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token based on how it was signed
            const userId = decoded.id || decoded.userId;
            const user = await User.findById(userId).select('-password');

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            return res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                dateOfBirth: user.dateOfBirth,
                age: user.age,
            });
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
});

// Update Profile Picture Route
router.put('/update-profile-picture', protect, async (req, res) => {
    try {
        // 1. Verify the JWT token to get the user ID (Handled by 'protect' middleware)
        if (!req.body.profilePicture) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        let secureUrl = req.body.profilePicture;
        
        // Check if it's a new upload (base64 string will be large, usually matching data:image or just very long)
        // Only upload to Cloudinary if it looks like a new base64 string
        if (secureUrl.startsWith('data:image') || secureUrl.length > 500) {
            const uploadResponse = await cloudinary.uploader.upload(secureUrl, {
                folder: 'mindaura_profiles'
            });
            secureUrl = uploadResponse.secure_url;
        }

        // 2 & 3 & 4. Find the user and explicitly update the profile picture field
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: secureUrl },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 5. Add a console.log BEFORE sending the response
        console.log("Image successfully saved to MongoDB with findByIdAndUpdate!");

        // 6. Return the updated user object
        return res.status(200).json(user);
    } catch (error) {
        console.error("Profile picture update error:", error);
        return res.status(500).json({ message: "Server error while updating profile picture" });
    }
});

// Update User Profile Details Route
router.put('/update-profile', protect, async (req, res) => {
    try {
        const { name, dateOfBirth, age } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.name = name || user.name;
        user.dateOfBirth = dateOfBirth || user.dateOfBirth;
        user.age = age || user.age;

        await user.save();

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            dateOfBirth: user.dateOfBirth,
            age: user.age,
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return res.status(500).json({ message: "Server error while updating profile details" });
    }
});

// Update Email Route
router.put('/update-email', protect, async (req, res) => {
    try {
        const { newEmail } = req.body;
        if (!newEmail) {
            return res.status(400).json({ message: "New email is required" });
        }

        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already in use by another account" });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { email: newEmail },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "Email updated successfully. Please log in again." });
    } catch (error) {
        console.error("Update email error:", error);
        return res.status(500).json({ message: "Server error while updating email" });
    }
});

// Update Password Route
router.put('/update-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new passwords are required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isMatch = await bcryptjs.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password" });
        }

        // Hash and save new password
        const salt = await bcryptjs.genSalt(10);
        user.password = await bcryptjs.hash(newPassword, salt);
        await user.save();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Update password error:", error);
        return res.status(500).json({ message: "Server error while updating password" });
    }
});

// Delete Account Route
router.delete('/delete-account', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({ message: "Server error while deleting account" });
    }
});

// Get Current User (Web Auth Validation) Route
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error("Get /me error:", error);
        return res.status(500).json({ message: "Server error while fetching user" });
    }
});

module.exports = router;
