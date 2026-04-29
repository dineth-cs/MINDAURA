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
// Helper function to create a delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.handleChat = async (req, res) => {
    try {
        console.log("=== Message Received ===", req.body.message);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ response: "⚠️ API Key is missing in Render!" });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const payload = {
            system_instruction: {
                parts: [{ text: "You are Aura, a friendly, empathetic, and professional wellness and mental health assistant. Your creator is Dineth Hasaranga. Keep your answers concise, supportive, and strictly related to wellness and well-being. Use emojis occasionally." }]
            },
            contents: [{ parts: [{ text: req.body.message }] }]
        };

        // Auto-Retry Logic: Try up to 3 times
        let retries = 3;
        while (retries > 0) {
            try {
                const response = await axios.post(url, payload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const responseText = response.data.candidates[0].content.parts[0].text;
                return res.status(200).json({ response: responseText });
                
            } catch (error) {
                const status = error?.response?.status;
                // If Rate Limited (429) or Server Busy (503), wait and retry
                if ((status === 429 || status === 503) && retries > 1) {
                    console.log(`⚠️ Rate limited by Google! Retrying... (${retries - 1} attempts left)`);
                    retries--;
                    await sleep(2000); // Wait 2 seconds before trying again
                    continue; 
                }
                // If it's a different error or out of retries, throw it to the main catch block
                throw error;
            }
        }

    } catch (error) {
        const errMsg = error?.response?.data?.error?.message || error.message;
        console.error("=== FINAL API ERROR ===", errMsg);
        
        return res.status(200).json({ 
            response: "⚠️ I'm getting a lot of messages right now. Just give me a few seconds and try again! ⏳" 
        });
    }
};