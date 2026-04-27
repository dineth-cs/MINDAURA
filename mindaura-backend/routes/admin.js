const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes in this file are protected and admin-only
router.use(protect);
router.use(admin);

// Analytics Routes
router.get('/analytics/user-growth', adminController.getUserGrowth);
router.get('/analytics/mood-distribution', adminController.getMoodDistribution);

// User Management Actions
router.put('/users/:id/suspend', adminController.suspendUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/:id/profile-stats', adminController.getUserProfileStats);

// Original Admin Routes
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/profile', adminController.getProfile);
router.put('/profile', adminController.updateProfile);
router.post('/firewall/toggle', adminController.toggleFirewall);
router.post('/rotate-keys', adminController.rotateKeys);
router.delete('/audit-logs/purge', adminController.purgeLogs);

module.exports = router;