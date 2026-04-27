const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Journal = require('../models/Journal');

// @desc    Get all journals for logged in user
// @route   GET /api/journal
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const journals = await Journal.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ journals });
    } catch (error) {
        console.error("Get journals error:", error);
        res.status(500).json({ message: "Server error while fetching journals." });
    }
});

// @desc    Create a new journal entry
// @route   POST /api/journal
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: "Content is required" });
        }

        // Mock emotion analysis (In real app, this would call an NLP service)
        const emotions = ['Happy', 'Sad', 'Anxious', 'Energy', 'Neutral'];
        const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];

        const journal = await Journal.create({
            user: req.user._id,
            content,
            emotion: randomEmotion
        });

        res.status(201).json({ journal, emotion: randomEmotion });
    } catch (error) {
        console.error("Create journal error:", error);
        res.status(500).json({ message: "Server error while creating journal." });
    }
});

module.exports = router;
