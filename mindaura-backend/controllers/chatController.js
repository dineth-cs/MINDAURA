const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. API Key එක හරියටම ගන්නවා
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handleChat = async (req, res) => {
    const { message, history } = req.body;

    // 2. පිළිවෙළට ට්‍රයි කරන්න ඕනේ මොඩල් ලිස්ට් එක
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    // 3. Gemini එකට ගැළපෙන විදියට History එක සුද්ද කිරීම
    // (පළවෙනි මැසේජ් එක 'model' ගේ නම් Gemini එක එරර් දෙනවා, ඒක නිසා ඒක අයින් කරනවා)
    let cleanHistory = [];
    if (history && Array.isArray(history)) {
        cleanHistory = history.filter(item => item.role === 'user' || item.role === 'model');
        if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
            cleanHistory.shift(); 
        }
    }

    let lastError = null;

    // 4. මොඩල් එකින් එක ට්‍රයි කරන ලූප් එක
    for (const modelName of modelsToTry) {
        try {
            console.log(`🤖 Trying model: ${modelName}`);
            
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: "You are Aura, an empathetic wellness assistant for the MindAura app. Be brief and supportive."
            });

            const chat = model.startChat({ history: cleanHistory });
            const result = await chat.sendMessage(message);
            const responseText = result.response.text();

            // ✅ වැඩේ හරි නම් මෙතනින් රිප්ලයි එක යවනවා
            console.log(`✅ Success with ${modelName}!`);
            return res.json({ response: responseText });

        } catch (error) {
            console.error(`❌ ${modelName} failed:`, error.message);
            lastError = error;
            continue; // ඊළඟ මොඩල් එකට යනවා
        }
    }

    // 5. මොඩල් 3ම ෆේල් වුණොත් විතරක් මේක යවනවා
    return res.status(500).json({ 
        response: "⚠️ ඔක්කොම මොඩල් ලිමිට් වෙලා වගෙයි. පොඩ්ඩක් ඉඳලා ආයෙත් ට්‍රයි කරන්න.",
        error: lastError ? lastError.message : "Unknown Error"
    });
};