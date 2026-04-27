const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const MoodEntry = require('../models/MoodEntry');

// POST /api/emotion/save  – save a new mood entry for the logged-in user
router.post('/save', protect, async (req, res) => {
    try {
        const { mood, source } = req.body;

        if (!mood) {
            return res.status(400).json({ message: 'mood is required' });
        }

        const entry = await MoodEntry.create({
            user: req.user._id,
            mood,
            source: source || 'face',
            date: new Date(),
        });

        return res.status(201).json(entry);
    } catch (error) {
        console.error('Save mood error:', error);
        return res.status(500).json({ message: 'Server error while saving mood' });
    }
});

// GET /api/emotion/history  – fetch all mood entries for the logged-in user (newest first)
router.get('/history', protect, async (req, res) => {
    try {
        const entries = await MoodEntry.find({ user: req.user._id })
            .sort({ date: -1 })
            .lean();

        return res.status(200).json(entries);
    } catch (error) {
        console.error('Fetch mood history error:', error);
        return res.status(500).json({ message: 'Server error while fetching mood history' });
    }
});

module.exports = router;
