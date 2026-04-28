const axios = require('axios');

exports.handleChat = async (req, res) => {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. Strict validation: Check if message is empty or undefined
    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'BAD_REQUEST', details: 'Message is required and cannot be empty.' });
    }

    if (!apiKey) {
        console.error("Critical Error: GEMINI_API_KEY is missing in .env");
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });
    }

    // 2. Debugging logs: See exact payload in Render logs
    console.log("Received message from frontend:", JSON.stringify(req.body, null, 2));

    try {
        // Multi-model routing logic
        let model = 'gemini-1.5-flash'; // Default: Fast and efficient
        
        const complexKeywords = ['deep summary', 'historical insight', 'analyze my month', 'long-term trends'];
        const isComplex = complexKeywords.some(kw => message.toLowerCase().includes(kw));
        
        if (isComplex) {
            model = 'gemini-1.5-pro'; // Complex/Long-term analysis
        }

        // 3. Verify API Config: Using formal system_instruction for Aura's personality
        const systemInstruction = `You are Aura, an empathetic wellness assistant for the MindAura app. 
        Your mission is to support users in their mental health journey with warmth, validation, and actionable wellness tips. 
        Align your personality with MindAura's mission of providing a safe, mindful, and restorative space. 
        Be concise but deeply supportive. If a user is in crisis, gently encourage them to seek professional help.`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [
                    ...history, // Previous conversation context
                    { role: 'user', parts: [{ text: message }] }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            }
        );

        if (!response.data.candidates || response.data.candidates.length === 0) {
            throw new Error('GEMINI_EMPTY_RESPONSE: Model returned no candidates.');
        }

        const reply = response.data.candidates[0].content.parts[0].text;
        res.json({ reply, modelUsed: model });

    } catch (error) {
        // 4. Better Error Logging: Log full stack trace
        console.error("Gemini API Error details:", error);
        
        const status = error.response ? error.response.status : 500;
        const errorData = error.response ? error.response.data : { message: error.message };
        
        res.status(status).json({ 
            error: 'AI_CHAT_ERROR', 
            details: errorData 
        });
    }
};
