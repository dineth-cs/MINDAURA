const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handleChat = async (req, res) => {
    try {
        const userMessage = req.body.message;
        
        // 1. API Key එක තියෙනවද බලමු
        if (!process.env.GEMINI_API_KEY) {
            return res.json({ response: "❌ සර්වර් එකේ GEMINI_API_KEY එක දාලා නෑ බ්‍රෝ!" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 2. AI එකට මැසේජ් එක යවමු (History නැතුව)
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        // 🎯 මෙන්න මේකයි වැදගත්ම කෑල්ල!
        // සර්වර් එකේ වෙන ඇත්තම ලෙඩේ Aura ගේ රිප්ලයි එකක් විදියට ෆෝන් එකට යවනවා.
        console.error("DEBUG ERROR:", error);
        res.json({ response: `⚠️ සර්වර් එකේ අවුලක්: ${error.message}` });
    }
};