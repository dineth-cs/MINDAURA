const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
    try {
        const userMessage = req.body.message;
        let rawHistory = req.body.history || [];

        if (!userMessage) {
            return res.status(400).json({ error: "Message is required" });
        }

        // 🎯 මෙන්න මේකයි Magic කෑල්ල!
        // Gemini එකට යවන්න කලින් History එක චෙක් කරනවා.
        // පළවෙනි මැසේජ් එක User ගේ නෙවෙයි නම් (Aura ගේ නම්), ඒක History එකෙන් අයින් කරනවා.
        let cleanHistory = [...rawHistory];
        if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
            cleanHistory.shift(); // පළවෙනි එක කපලා දානවා
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are Aura, an empathetic wellness assistant for the MindAura app. Your mission is to support users in their mental health journey with warmth, validation, and actionable wellness tips."
        });

        const chat = model.startChat({
            history: cleanHistory, // දැන් යවන්නේ සුද්ද කරපු History එක
        });

        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        res.json({ response: responseText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to generate response from AI" });
    }
};