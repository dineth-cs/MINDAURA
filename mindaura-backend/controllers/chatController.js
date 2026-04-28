const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        
        // මේ නම අනිවාර්යයෙන්ම වැඩ!
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error("Gemini Error:", error);
        res.json({ response: `⚠️ Google API Error: ${error.message}` });
    }
};