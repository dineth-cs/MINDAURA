const { GoogleGenerativeAI } = require('@google/generative-ai');

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

        if (!process.env.GEMINI_API_KEY) {
            return res.status(200).json({ response: "⚠️ API Key is missing in Render!" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(req.body.message);
        const responseText = result.response.text();

        return res.status(200).json({ response: responseText });

    } catch (error) {
        console.error("=== CRITICAL ERROR ===", error.message);
        // Return 200 status so Axios doesn't crash, and send the error to the UI
        return res.status(200).json({ 
            response: `⚠️ Backend Error: ${error.message}` 
        });
    }
};