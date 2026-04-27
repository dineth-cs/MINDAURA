const mongoose = require('mongoose');

const MoodEntrySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        mood: {
            type: String,
            required: true,
            enum: ['Happy', 'Sad', 'Stress', 'Anxious', 'Energy', 'Bored', 'Neutral'],
        },
        source: {
            type: String,
            enum: ['face', 'voice', 'journal'],
            default: 'face',
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('MoodEntry', MoodEntrySchema);
