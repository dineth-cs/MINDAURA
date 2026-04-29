const axios = require('axios');

exports.handleChat = async (req, res) => {
    try {
        console.log("=== Message Received ===", req.body.message);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ response: "⚠️ API Key is missing in Render!" });
        }

        // Using the Pro model as requested
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
        
        const payload = {
            system_instruction: {
                parts: [{ text: "You are Aura, a friendly, empathetic, and professional wellness and mental health assistant. Your creator is Dineth Hasaranga. Keep your answers concise, supportive, and strictly related to wellness and well-being. Use emojis occasionally." }]
            },
            contents: [{ parts: [{ text: req.body.message }] }]
        };

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const responseText = response.data.candidates[0].content.parts[0].text;
        return res.status(200).json({ response: responseText });

    } catch (error) {
        // Capture and send the REAL error from Google or Axios
        const errMsg = error?.response?.data?.error?.message || error.message;
        console.error("=== API ERROR ===", errMsg);
        
        return res.status(200).json({ 
            response: `⚠️ Real Error: ${errMsg}` 
        });
    }
};
