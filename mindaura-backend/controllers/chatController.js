const axios = require('axios');

exports.handleChat = async (req, res) => {
    try {
        console.log("=== Message Received ===", req.body.message);

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ response: "⚠️ GROQ API Key is missing in Render!" });
        }

        // 1. Extract the new message and the conversation history
        const userMessage = req.body.message;
        const chatHistory = req.body.history || []; 

        // 2. Sliding Window: Get only the last 6 messages (3 from user, 3 from Aura)
        const recentHistory = chatHistory.slice(-6);

        const url = 'https://api.groq.com/openai/v1/chat/completions';
        
        // 3. Construct the full prompt: System + Recent History + New Message
        const messages = [
            {
                role: "system",
                content: `You are Aura, a highly empathetic, supportive, and friendly mental wellness companion created by Dineth Hasaranga. Speak to the user like a close, caring human friend, not a robotic assistant. Use natural, warm, and conversational language with occasional emojis. 
    
    STRICT RULES:
    1. CORE DOMAIN: You MUST ONLY discuss emotions, mental well-being, lifestyle, stress management, and daily habits. If the user asks about ANY unrelated topics (e.g., coding, math, general knowledge, writing essays), politely refuse and gently guide the conversation back to how they are feeling.
    2. NO MEDICAL ADVICE: YOU ARE NOT A DOCTOR. You MUST NEVER provide medical advice, diagnose conditions, or prescribe/suggest ANY medications. If the user asks for medical advice or mentions severe physical symptoms, you must kindly remind them that you are just a wellness friend and advise them to consult a qualified healthcare professional immediately.
    3. Keep responses relatively concise and focused on the user's feelings.`
            },
            ...recentHistory, // Spread the last 6 messages here
            {
                role: "user",
                content: userMessage
            }
        ];

        const payload = {
            model: "llama-3.1-8b-instant",
            messages: messages
        };

        const response = await axios.post(url, payload, {
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json' 
            }
        });

        const responseText = response.data.choices[0].message.content;
        return res.status(200).json({ response: responseText });

    } catch (error) {
        const errMsg = error?.response?.data?.error?.message || error.message;
        console.error("=== GROQ API ERROR ===", errMsg);
        
        return res.status(200).json({ 
            response: `⚠️ Error: ${errMsg}` 
        });
    }
};
