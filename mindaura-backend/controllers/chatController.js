const axios = require('axios');

exports.handleChat = async (req, res) => {
    try {
        console.log("=== Message Received ===", req.body.message);

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ response: "⚠️ GROQ API Key is missing in Render!" });
        }

        const url = 'https://api.groq.com/openai/v1/chat/completions';
        
        const payload = {
            model: "llama-3.1-8b-instant", // Updated to the new active Llama 3.1 model
            messages: [
                {
                    role: "system",
                    content: "You are Aura, a friendly, empathetic, and professional wellness and mental health assistant. Your creator is Dineth Hasaranga. Keep your answers concise, supportive, and strictly related to wellness and well-being. Use emojis occasionally."
                },
                {
                    role: "user",
                    content: req.body.message
                }
            ]
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
