const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { clearUserData, deleteUserAccount } = require('../controllers/userController');

// @desc    Clear all mood history
// @route   DELETE /api/v1/users/clear-data
// @access  Private
router.delete('/clear-data', protect, clearUserData);

// @desc    Delete user account and all associated data
// @route   DELETE /api/v1/users/delete-account
// @access  Private
router.delete('/delete-account', protect, deleteUserAccount);

module.exports = router;
