const { GoogleGenerativeAI } = require('@google/generative-ai');

// API Key එක ගන්නවා
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;

        // ගොඩක් වෙලාවට වැඩ කරන ස්ටේබල්ම මොඩල් එක පාවිච්චි කරමු
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // මැසේජ් එක යවනවා
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        // උත්තරේ යවනවා
        res.json({ response: text });

    } catch (error) {
        console.error("Gemini Error:", error);
        // එරර් එකක් වුණොත් ඒකත් චැට් එකේ පෙන්වනවා
        res.json({ response: `⚠️ Google API Error: ${error.message}` });
    }
};