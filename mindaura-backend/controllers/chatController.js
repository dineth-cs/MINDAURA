const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
    const { message } = req.body;
    
    // 1. පිළිවෙළට ට්‍රයි කරන්න ඕනේ මොඩල් ලිස්ට් එක
    const modelList = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    let lastError = null;

    // 2. එකින් එක මොඩල් එක ට්‍රයි කරන ලූප් එක
    for (const modelName of modelList) {
        try {
            console.log(`Trying model: ${modelName}...`);
            
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: "You are Aura, an empathetic wellness assistant."
            });

            const result = await model.generateContent(message);
            const response = await result.response;
            const text = response.text();

            // ✅ උත්තරේ ලැබුණොත් මෙතනින්ම රිපොන්ස් එක යවලා ලූප් එක නවත්වනවා
            console.log(`✅ Success with ${modelName}!`);
            return res.json({ response: text });

        } catch (error) {
            // ❌ මේ මොඩල් එකේ අවුලක් ආවොත් ඒක සටහන් කරගෙන ඊළඟ එකට යනවා
            console.error(`❌ ${modelName} failed:`, error.message);
            lastError = error;
            continue; 
        }
    }

    // 3. මොඩල් 3ම වැඩ කරේ නැත්නම් විතරක් එරර් එකක් යවනවා
    res.status(500).json({ 
        response: "⚠️ ඔක්කොම මොඩල් ලිමිට් වෙලා වගෙයි බ්‍රෝ. පොඩ්ඩක් ඉඳලා ආයෙ ට්‍රයි කරන්න.",
        debug: lastError.message 
    });
};