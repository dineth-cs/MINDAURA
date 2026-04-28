exports.handleChat = async (req, res) => {
    try {
        console.log("Dummy chat route hit!");
        
        // AI මුකුත් නෑ, කෙලින්ම මැසේජ් එකක් යවනවා ෆෝන් එකට
        res.json({ response: "අඩේ දිනෙත්, කනෙක්ෂන් එක 100% වැඩ බ්‍රෝ! මේක ෆෝන් එකට ආවා කියන්නේ පාර ක්ලියර්. අවුල තියෙන්නේ AI පැකේජ් එකේ!" });

    } catch (error) {
        res.json({ response: "Error caught inside basic test." });
    }
};