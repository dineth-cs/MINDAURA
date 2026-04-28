const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini API එක ලෝඩ් කිරීම
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
    try {
        console.log("Chat route hit! Message:", req.body.message);

        const userMessage = req.body.message;
        // History එකක් ආවේ නැත්නම් හිස් Array එකක් ගන්නවා (අර කලින් ආපු එරර් එක එන්නේ නෑ)
        let history = req.body.history || []; 

        if (!userMessage) {
            return res.status(400).json({ error: "Message is required" });
        }

        // AI මොඩල් එක සහ Aura ගේ පෞරුෂය හැදීම
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: "You are Aura, an empathetic wellness assistant for the MindAura app. Your mission is to support users in their mental health journey with warmth, validation, and actionable wellness tips."
        });

        // චැට් එක පටන් ගැනීම
        const chat = model.startChat({
            history: history,
        });

        // මැසේජ් එක යවලා උත්තරේ ගැනීම
        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        console.log("Aura responded successfully!");

        // ෆෝන් එකට උත්තරේ යවනවා
        res.json({ response: responseText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Failed to generate response from AI" });
    }
};