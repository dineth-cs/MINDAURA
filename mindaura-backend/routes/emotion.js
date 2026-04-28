const express = require('express');
const router = express.Router();
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
                // 1. Clean base64 string (strip data URI prefix if present)
                const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

                // 2. Create binary buffer
                const buffer = Buffer.from(cleanBase64, 'base64');

                // 3. Use native fetch (Node.js v18+) to bypass any axios config conflicts
                const hfFetchResponse = await fetch(
                    'https://api-inference.huggingface.co/models/dima806/facial_emotions_image_detection',
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                            'Content-Type': 'application/octet-stream'
                        },
                        body: buffer
                    }
                );

                if (!hfFetchResponse.ok) {
                    const errText = await hfFetchResponse.text();
                    throw new Error(`Hugging Face Fetch Error ${hfFetchResponse.status}: ${errText}`);
                }

                const results = await hfFetchResponse.json();
                console.log('Hugging Face API Response:', JSON.stringify(results, null, 2));

                // Check if we got a valid array from AI
                if (!Array.isArray(results) || results.length === 0) {
                    throw new Error('Invalid AI response: Results array is empty or malformed.');
                }

                // Find the top result (highest confidence score)
                const topResult = results.sort((a, b) => b.score - a.score)[0];
                console.log('AI Top Result:', topResult);

                // STRICT VALIDATION: Must be >= 0.45 confidence to confirm a human face
                if (topResult.score < 0.45) {
                    console.warn(`Face validation FAILED: Confidence ${topResult.score} is below threshold.`);
                    return res.status(400).json({
                        message: 'No human face clearly detected. Please face the camera directly and try again.'
                    });
                }

                // POSITIVE OVERRIDE: Map negative emotions to Neutral
                const negativeEmotions = ['sad', 'angry', 'disgust', 'fear', 'stress'];
                const detectedEmotion = topResult.label.toLowerCase();

                if (negativeEmotions.includes(detectedEmotion)) {
                    console.log(`Mapping negative emotion (${detectedEmotion}) → Neutral.`);
                    mood = 'Neutral';
                } else {
                    const validMoods = ['Happy', 'Sad', 'Stress', 'Anxious', 'Energy', 'Bored', 'Neutral'];
                    const capitalizedLabel = detectedEmotion.charAt(0).toUpperCase() + detectedEmotion.slice(1);
                    mood = validMoods.includes(capitalizedLabel) ? capitalizedLabel : 'Happy';
                }

            } catch (aiError) {
                console.error('Hugging Face Error:', aiError.message);
                return res.status(400).json({ message: 'Face analysis failed. Please try again.' });
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
