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
                content: "You are Aura, a friendly, empathetic, and professional wellness and mental health assistant. Your creator is Dineth Hasaranga. Keep your answers concise, supportive, and strictly related to wellness and well-being. Use emojis occasionally."
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
