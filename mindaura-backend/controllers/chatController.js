const axios = require('axios');

exports.handleChat = async (req, res) => {
    const { message, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });
    }

    try {
        // Multi-model routing logic
        let model = 'gemini-1.5-flash'; // Default: Fast and efficient
        
        const complexKeywords = ['deep summary', 'historical insight', 'analyze my month', 'long-term trends'];
        const isComplex = complexKeywords.some(kw => message.toLowerCase().includes(kw));
        
        if (isComplex) {
            model = 'gemini-1.5-pro'; // Complex/Long-term analysis
        }

        const systemInstruction = `You are Aura, an empathetic wellness assistant for the MindAura app. 
        Your mission is to support users in their mental health journey with warmth, validation, and actionable wellness tips. 
        Align your personality with MindAura's mission of providing a safe, mindful, and restorative space. 
        Be concise but deeply supportive. If a user is in crisis, gently encourage them to seek professional help.`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                contents: [
                    { role: 'user', parts: [{ text: systemInstruction }] },
                    { role: 'model', parts: [{ text: "Understood. I am Aura, your empathetic wellness assistant. How can I help you today?" }] },
                    ...history,
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

        const reply = response.data.candidates[0].content.parts[0].text;
        res.json({ reply, modelUsed: model });

    } catch (error) {
        console.error('Gemini API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'AI_CHAT_ERROR', details: error.message });
    }
};
