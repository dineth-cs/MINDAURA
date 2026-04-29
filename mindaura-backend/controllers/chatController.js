const axios = require('axios');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.handleChat = async (req, res) => {
    try {
        console.log("=== Message Received ===", req.body.message);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ response: "⚠️ API Key is missing in Render!" });
        }

        // Using the requested Pro model
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
        
        const payload = {
            system_instruction: {
                parts: [{ text: "You are Aura, a friendly, empathetic, and professional wellness and mental health assistant. Your creator is Dineth Hasaranga. Keep your answers concise, supportive, and strictly related to wellness and well-being. Use emojis occasionally." }]
            },
            contents: [{ parts: [{ text: req.body.message }] }]
        };

        let retries = 3;
        while (retries > 0) {
            try {
                const response = await axios.post(url, payload, {
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const responseText = response.data.candidates[0].content.parts[0].text;
                return res.status(200).json({ response: responseText });
                
            } catch (error) {
                const status = error?.response?.status;
                if ((status === 429 || status === 503) && retries > 1) {
                    console.log(`⚠️ Rate limited by Google API Free Tier! Retrying... (${retries - 1} attempts left)`);
                    retries--;
                    await sleep(2000); 
                    continue; 
                }
                throw error;
            }
        }

    } catch (error) {
        const errMsg = error?.response?.data?.error?.message || error.message;
        console.error("=== FINAL API ERROR ===", errMsg);
        
        return res.status(200).json({ 
            response: `⚠️ Error: ${errMsg}` 
        });
    }
};