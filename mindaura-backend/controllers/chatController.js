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
    const { message, history } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 2. පිළිවෙළට ට්‍රයි කරන්න ඕනේ මොඩල් ලිස්ට් එක (Rotation Logic)
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    let lastError = null;

    // 3. එකින් එක මොඩල් එක ට්‍රයි කරන ලූප් එක
    for (const modelName of modelsToTry) {
        try {
            console.log(`🤖 Trying Aura with model: ${modelName}`);
            
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: AURA_SYSTEM_PROMPT // Aura ගේ පෞරුෂය මෙතනට දෙනවා
            });

            // History එක සුද්ද කිරීම (Gemini එකට ගැළපෙන විදියට)
            let cleanHistory = [];
            if (history && Array.isArray(history)) {
                cleanHistory = history.map(item => ({
                    role: item.role === 'user' ? 'user' : 'model',
                    parts: [{ text: item.text || "" }]
                }));
                // පළවෙනි එක model ගේ නම් ඒක අයින් කරනවා
                if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
                    cleanHistory.shift();
                }
            }

            const chat = model.startChat({ history: cleanHistory });
            const result = await chat.sendMessage(message);
            const responseText = result.response.text();

            // ✅ වැඩේ හරි නම් මෙතනින් රිප්ලයි එක යවනවා
            console.log(`✅ Success with ${modelName}!`);
            return res.json({ response: responseText });

        } catch (error) {
            console.error(`❌ ${modelName} failed:`, error.message);
            lastError = error;
            continue; // ඊළඟ මොඩල් එකට මාරු වෙනවා
        }
    }

    // 4. මොඩල් 3ම වැඩ කරේ නැත්නම් විතරක් මේක යවනවා
    return res.status(500).json({ 
        response: "⚠️ Aura is resting for a moment. Please try again soon.",
        debug: lastError ? lastError.message : "Unknown Error"
    });
};