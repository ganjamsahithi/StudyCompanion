// backend/routes/chat.js
const router = require('express').Router();
const { GoogleGenAI } = require('@google/genai');


const ChatThread = require('../models/chatThread.model');
const aiService = require('../services/ai.service'); 
const ai = new GoogleGenAI({}); 

const systemInstruction = `You are Agent Compass, a helpful, encouraging, and highly knowledgeable academic assistant designed for college students.
Your responses should be clear, detailed, and directly answer course-related questions.
Use Markdown formatting (like **bold** and lists) for structure and emphasis. Encourage the student to keep studying!`;


// GET /chat/threads - List all chat threads for the current user
router.route('/threads').get(async (req, res) => {
    try {
        const threads = await ChatThread.find({ userId: 'default_user' })
            .select('_id title updatedAt')
            .sort({ updatedAt: -1 });

        res.json(threads);
    } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ message: 'Failed to fetch chat history.' });
    }
});

// GET /chat/threads/:id - Load a specific thread's messages
router.route('/threads/:id').get(async (req, res) => {
    try {
        const thread = await ChatThread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ message: 'Chat thread not found.' });
        }
        res.json(thread);
    } catch (error) {
        console.error('Error loading thread:', error);
        res.status(500).json({ message: 'Failed to load thread messages.' });
    }
});

// POST /chat/send - Handles message sending, thread creation, and AI response
router.route('/send').post(async (req, res) => {
    const { message, threadId } = req.body;
    const userId = 'default_user';
    const firstUserMessage = message; 
    let thread;
    let newThreadCreated = false;


    if (!message) {
        return res.status(400).json({ message: 'Message content is required.' });
    }

    try {

        // 1. Load or Create Thread
        if (threadId) {
            thread = await ChatThread.findById(threadId);
        }

        if (!thread) {
            const initialTitle = firstUserMessage.substring(0, 20) + '...';
            thread = new ChatThread({ userId, title: initialTitle, messages: [] });
            newThreadCreated = true;
            thread.messages.push({
                sender: 'model',
                text: "Hello! I'm Agent Compass. What course concepts can I help you with today?"
            });
        }

        // 2. Add User Message
        thread.messages.push({ sender: 'user', text: message });

        // 3. Prepare History and Call the Gemini API
        const contents = thread.messages.map(msg => ({
            role: msg.sender,
            parts: [{ text: msg.text }]
        }));
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: { systemInstruction: { parts: [{ text: systemInstruction }] } }

        });

        const agentResponse = response.text;


        // 4. Add Agent Response and Save Thread
        thread.messages.push({ sender: 'model', text: agentResponse });

        // 5. If new, generate and update the title
        if (newThreadCreated) {
            const newTitle = await aiService.generateChatTitle(firstUserMessage, agentResponse);
            thread.title = newTitle;
        }

        await thread.save();

        res.json({
            text: agentResponse,
            threadId: thread._id,
            newThread: newThreadCreated,
            updatedTitle: thread.title 
        });


    } catch (error) {
        console.error('Gemini Chat Error:', error);
        res.status(500).json({ 
            text: "Sorry, Agent Compass is currently experiencing technical difficulties.",
            error: error.message 
        });
    }
});


// POST /chat/rename/:id - Rename a chat thread
router.route('/rename/:id').post(async (req, res) => {
    try {
        const { newTitle } = req.body;
        const thread = await ChatThread.findById(req.params.id);

        if (!thread) {
            return res.status(404).json({ message: 'Chat thread not found.' });
        }
        if (!newTitle || newTitle.trim().length === 0) {
            return res.status(400).json({ message: 'New title cannot be empty.' });
        }

        thread.title = newTitle.trim().substring(0, 50); // Limit length
        await thread.save();

        res.json({ message: 'Thread renamed successfully.', newTitle: thread.title });
    } catch (error) {
        console.error('Error renaming thread:', error);
        res.status(500).json({ message: 'Failed to rename thread.' });
    }
});

// DELETE /chat/delete/:id - Delete a chat thread
router.route('/delete/:id').delete(async (req, res) => {
    try {
        const result = await ChatThread.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ message: 'Chat thread not found.' });
        }

        res.json({ message: 'Thread deleted successfully.', threadId: req.params.id });
    } catch (error) {
        console.error('Error deleting thread:', error);
        res.status(500).json({ message: 'Failed to delete thread.' });
    }
});


module.exports = router;