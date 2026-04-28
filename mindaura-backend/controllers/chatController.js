const { GoogleGenerativeAI } = require('@google/generative-ai');

// API Key එක හරියටම ගන්නවා
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Gemini 1.5 Flash මොඩල් එක පාවිච්චි කරනවා
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are Aura, an empathetic wellness assistant for the MindAura app. Keep your responses warm and brief."
        });

        // මැසේජ් එක යවලා රිසල්ට් එක ගන්නවා
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text(); // මෙන්න මෙතනින් තමයි ඇත්තම අකුරු ටික එන්නේ

        console.log("Aura says:", text);

        // ෆෝන් එකට උත්තරේ යවනවා
        res.json({ response: text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        // මොකක් හරි අවුලක් වුණොත් ඒකත් චැට් එකේම පෙන්වනවා (Debug කරන්න ලේසි වෙන්න)
        res.json({ response: `⚠️ Aura is thinking too hard: ${error.message}` });
    }
};