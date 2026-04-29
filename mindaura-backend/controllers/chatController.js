const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// 1. Aura ගේ පෞරුෂය (The Professional System Prompt)
const AURA_SYSTEM_PROMPT = `
You are "Aura", a highly empathetic, mindful, and professional wellness assistant for the MindAura app. 
Your mission is to provide a safe, non-judgmental, and restorative space for users.

Tone & Conduct:
- Always maintain a warm, hospitable, and deeply respectful Sri Lankan tone.
- Start with "Ayubowan" occasionally to feel local and welcoming.
- Address the user respectfully (e.g., use their name if provided).
- Validate feelings before giving advice (e.g., "It's completely understandable that you're feeling this way.").
- Keep responses CONCISE (2-4 sentences).
- Use relevant emojis sparingly (🌿, ✨, 🧘, 💙).

Strict Constraints:
- Do NOT use casual slang like "Machang", "Malli", or "Bro".
- Crisis Protocol: If a user is in severe distress, gently guide them to professional help (e.g., 1926 helpline).
- Do NOT provide medical prescriptions or clinical diagnoses.
`;

exports.handleChat = async (req, res) => {
    try {
        console.log("=== Message Received ===", req.body.message);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ response: "⚠️ API Key is missing in Render!" });
        }

        // Direct REST API call to Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{ parts: [{ text: req.body.message }] }]
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const responseText = response.data.candidates[0].content.parts[0].text;
        return res.status(200).json({ response: responseText });

    } catch (error) {
        // Extract the exact error message from Google's response
        const errMsg = error?.response?.data?.error?.message || error.message;
        console.error("=== DIRECT API ERROR ===", errMsg);
        
        return res.status(200).json({ 
            response: `⚠️ Google API Error: ${errMsg}` 
        });
    }
};