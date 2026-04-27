const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
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

            // Get user from the token
            const userId = decoded.id || decoded.userId;
            req.user = await User.findById(userId).select('-password');

            // 1. Check if user still exists (could have been deleted by admin)
            if (!req.user) {
                return res.status(401).json({ message: "Not authorized, user not found or deleted" });
            }

            // 2. Check if user is suspended
            if (req.user.status === 'SUSPENDED') {
                return res.status(403).json({ message: "Account suspended" });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admins only." });
    }
};

module.exports = { protect, admin };
