// backend/routes/chat.js
const router = require('express').Router();
const { GoogleGenAI } = require('@google/genai');

// Initialize the Gemini AI client
// It automatically looks for GEMINI_API_KEY in process.env
const ai = new GoogleGenAI({}); 

// Define a system instruction for the chat agent
const systemInstruction = `You are Agent Compass, a helpful, encouraging, and highly knowledgeable academic assistant designed for college students.
Your responses should be clear, detailed, and directly answer course-related questions.
Use bold formatting for key terms and concepts. Encourage the student to keep studying!`;

// POST /chat/send - Endpoint to handle user messages and get AI response
router.route('/send').post(async (req, res) => {
    // req.body should contain { message: "user's query", history: [...] }
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Message content is required.' });
    }

    try {
        // Construct the full conversation history for the API call
        // The API expects a specific structure: [{ role: "user/model", parts: [...] }]
        const contents = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        
        // Add the current user message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Call the Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents, // Send the full history
            config: {
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                }
            }
        });

        const agentResponse = response.text;

        res.json({ text: agentResponse });

    } catch (error) {
        console.error('Gemini Chat Error:', error);
        res.status(500).json({ 
            text: "Sorry, Agent Compass is currently experiencing technical difficulties.",
            error: error.message 
        });
    }
});

module.exports = router;