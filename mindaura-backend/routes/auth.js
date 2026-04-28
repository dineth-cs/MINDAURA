const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const MoodEntry = require('../models/MoodEntry');
const SupportTicket = require('../models/SupportTicket');
const Journal = require('../models/Journal');
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

        if (req.io) {
            req.io.emit('new_user_registered', {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
                status: 'ACTIVE',
                tier: 'TIER 1'
            });
        }

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
            { userId: user._id, isAdmin: user.isAdmin },
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
            isAdmin: user.isAdmin,
            token
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Admin ONLY Login Route
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("==== ADMIN LOGIN ATTEMPT ====");
        console.log("Received Email:", email);
        console.log("Received Password (raw):", password);

        // Check if user exists
        const user = await User.findOne({ email });
        console.log("User Found in DB:", user ? user.email : "NO USER FOUND");
        if (user) {
            console.log("Hashed Password in DB:", user.password);
        }

        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Strongly enforce Admins
        console.log("Is User Admin?:", user.isAdmin);
        if (!user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        // Compare password
        const isMatch = await bcryptjs.compare(password, user.password);
        console.log("Password Match Result:", isMatch);
        console.log("=============================");

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
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

        // Set OTP and expiration (5 mins)
        user.resetPasswordOtp = otp;
        user.resetPasswordExpire = Date.now() + 5 * 60 * 1000;
        await user.save();

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Send branded HTML email
        const mailOptions = {
            from: `"MindAura" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '🔐 Your MindAura Password Reset OTP',
            html: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB">
                    <div style="background:linear-gradient(135deg,#6B8EFE,#A78BFA);padding:32px 24px;text-align:center">
                        <p style="font-size:32px;margin:0 0 8px">🧠</p>
                        <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0">MindAura</h1>
                        <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:4px 0 0">Your Mental Wellness Companion</p>
                    </div>
                    <div style="padding:32px 24px">
                        <h2 style="color:#1F2937;font-size:18px;font-weight:700;margin:0 0 8px">Password Reset Request</h2>
                        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px">Hi <strong>${user.name}</strong>, we received a request to reset your MindAura password. Use the OTP below to continue. It expires in <strong>5 minutes</strong>.</p>
                        <div style="background:#F0F4FF;border:2px dashed #6B8EFE;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                            <p style="color:#6B7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Your One-Time Password</p>
                            <p style="color:#6B8EFE;font-size:40px;font-weight:800;letter-spacing:10px;margin:0">${otp}</p>
                        </div>
                        <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0">If you did not request this, you can safely ignore this email. Your password will not change.</p>
                    </div>
                    <div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:16px 24px;text-align:center">
                        <p style="color:#9CA3AF;font-size:11px;margin:0">© ${new Date().getFullYear()} MindAura · All rights reserved</p>
                    </div>
                </div>
            `,
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
        const userId = req.user._id;

        // Cascade delete: Remove all associated data before removing the user
        await Promise.all([
            MoodEntry.deleteMany({ user: userId }),
            SupportTicket.deleteMany({ user: userId }),
            User.findByIdAndDelete(userId)
        ]);

        return res.status(200).json({ message: "Account and all associated data deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({ message: "Server error while deleting account" });
    }
});

// Clear Data Route
router.delete('/clear-data', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Strictly delete only associated data, not the user account
        await Promise.all([
            MoodEntry.deleteMany({ user: userId }),
            Journal.deleteMany({ user: userId }),
            SupportTicket.deleteMany({ user: userId }),
        ]);

        res.status(200).json({ message: "All your personal data has been cleared successfully." });
    } catch (error) {
        console.error("Clear data error:", error);
        res.status(500).json({ message: "Server error while clearing data." });
    }
});

// Get Current User (Web Auth Validation) Route
router.put('/update-push-token', protect, async (req, res) => {
    try {
        const { expoPushToken } = req.body;
        if (!expoPushToken) {
            return res.status(400).json({ message: "Push token is required" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.expoPushToken = expoPushToken;
        await user.save();

        return res.status(200).json({ message: "Push token updated successfully" });
    } catch (error) {
        console.error("Update push token error:", error);
        return res.status(500).json({ message: "Server error while updating push token" });
    }
});

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                dateOfBirth: user.dateOfBirth,
                age: user.age,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error("Get /me error:", error);
        return res.status(500).json({ message: "Server error while fetching user" });
    }
});

// GET /api/auth/profile — return the current user's full profile (including dailyTasks)
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            dateOfBirth: user.dateOfBirth,
            age: user.age,
            isAdmin: user.isAdmin,
            dailyTasks: user.dailyTasks || [],
        });
    } catch (error) {
        console.error('GET /profile error:', error);
        return res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

// PUT /api/auth/profile — update profile fields including dailyTasks
router.put('/profile', protect, async (req, res) => {
    try {
        const { dailyTasks, name, dateOfBirth, age } = req.body;

        const updateFields = {};
        if (dailyTasks !== undefined) updateFields.dailyTasks = dailyTasks;
        if (name !== undefined) updateFields.name = name;
        if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;
        if (age !== undefined) updateFields.age = age;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        console.log(`Profile updated for user ${req.user._id}. Tasks count: ${user.dailyTasks?.length ?? 0}`);
        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            dateOfBirth: user.dateOfBirth,
            age: user.age,
            dailyTasks: user.dailyTasks || [],
        });
    } catch (error) {
        console.error('PUT /profile error:', error);
        return res.status(500).json({ message: 'Server error while updating profile' });
    }
});

module.exports = router;
