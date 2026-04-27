const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const MoodEntry = require('../models/MoodEntry');
const SupportTicket = require('../models/SupportTicket');
const Journal = require('../models/Journal');

// @desc    Clear all user data (Moods, Journals, Support Tickets)
// @route   DELETE /api/users/clear-data
// @access  Private
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

module.exports = router;
