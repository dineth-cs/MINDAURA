const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handleChat = async (req, res) => {
    const { message } = req.body;
    const history = req.body.history || [];
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Validation
    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'BAD_REQUEST', details: 'Message is required.' });
    }

    if (!apiKey) {
        console.error("Critical Error: GEMINI_API_KEY is missing in .env");
        return res.status(500).json({ error: 'SERVER_CONFIG_ERROR', details: 'Gemini API Key not configured.' });
    }

    try {
        // 2. Initialize Gemini SDK
        const genAI = new GoogleGenerativeAI(apiKey);

        // 3. Configure the model with system instructions
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: `You are Aura, an empathetic wellness assistant for the MindAura app. 
            Your mission is to support users in their mental health journey with warmth, validation, and actionable wellness tips. 
            Align your personality with MindAura's mission of providing a safe, mindful, and restorative space. 
            Be concise but deeply supportive. If a user is in crisis, gently encourage them to seek professional help.`
        });

        // 4. Start Chat with history
        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // 5. Send message and get response
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // 6. Return response to frontend
        res.json({ reply: text });

    } catch (error) {
        console.error("Gemini SDK Error:", error);
        
        // Handle specific API errors
        const status = error.status || 500;
        res.status(status).json({ 
            error: 'AI_CHAT_ERROR', 
            details: error.message || 'An unexpected error occurred during chat.'
        });
    }
};
