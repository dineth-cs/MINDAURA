const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        
        // ගොඩක්ම ස්ටේබල් මොඩල් එක
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        return res.json({ response: text });

    } catch (error) {
        console.error("Gemini Error:", error);
        // එරර් එක ෆෝන් එකේ පේන්න යවනවා
        return res.json({ response: `⚠️ Aura Error: ${error.message}` });
    }
};