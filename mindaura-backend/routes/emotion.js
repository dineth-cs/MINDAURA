const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');
const MoodEntry = require('../models/MoodEntry');

// POST /api/emotion/save  – save a new mood entry for the logged-in user
router.post('/save', protect, async (req, res) => {
    try {
        let { mood, source, image } = req.body;

        // --- Strict Face Validation & AI Detection using Hugging Face ---
        if (source === 'face' && image) {
            console.log('Backend: Performing strict AI face validation via Hugging Face...');
            
            try {
                // 1. Clean the base64 string (remove data:image/jpeg;base64, prefix if present)
                const cleanedImage = image.replace(/^data:image\/\w+;base64,/, "");

                const hfResponse = await axios.post(
                    "https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection",
                    Buffer.from(cleanedImage, 'base64'),
                    {
                        headers: { 
                            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                            'Content-Type': 'application/octet-stream'
                        }
                    }
                );

                const results = hfResponse.data;
                console.log('Hugging Face API Response:', JSON.stringify(results, null, 2));
                
                // 1. Check if we got valid results from AI
                if (!Array.isArray(results) || results.length === 0) {
                    throw new Error("Invalid AI response: Results array is empty or malformed.");
                }

                // 2. Find the top result (highest score)
                const topResult = results.sort((a, b) => b.score - a.score)[0];
                console.log('AI Top Result:', topResult);

                // 3. DEBUG: Temporarily lowered confidence threshold (0.1) to diagnose detection issues
                if (topResult.score < 0.1) {
                    console.warn('Face validation FAILED: Confidence too low (', topResult.score, ') even with 0.1 threshold.');
                    return res.status(400).json({ 
                        message: "No human face clearly detected. Please face the camera directly and try again." 
                    });
                }

                // 4. POSITIVE OVERRIDE: Map negative emotions to Neutral/Tired
                const negativeEmotions = ['sad', 'angry', 'disgust', 'fear', 'stress'];
                const detectedEmotion = topResult.label.toLowerCase();
                
                if (negativeEmotions.includes(detectedEmotion)) {
                    console.log(`Mapping negative emotion (${detectedEmotion}) to Neutral.`);
                    mood = 'Neutral';
                } else {
                    // Map AI labels to our MoodEntry enum if they match, else use 'Happy' or 'Neutral'
                    const validMoods = ['Happy', 'Sad', 'Stress', 'Anxious', 'Energy', 'Bored', 'Neutral'];
                    const capitalizedLabel = detectedEmotion.charAt(0).toUpperCase() + detectedEmotion.slice(1);
                    mood = validMoods.includes(capitalizedLabel) ? capitalizedLabel : 'Happy';
                }

            } catch (aiError) {
                console.error('Hugging Face API Error:', aiError.response ? aiError.response.data : aiError.message);
                return res.status(400).json({ message: "Face analysis failed. Please try again." });
            }
        }
        // ------------------------------------------------

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
