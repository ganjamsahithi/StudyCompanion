// src/components/Chat/Chat.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chat.css';

const API_BASE_URL = 'http://localhost:5000/chat';
const CHAT_STORAGE_KEY = 'agentCompassChatHistory';

// --- Helper Function: Markdown to HTML Conversion ---
// (Copied from MyNotes.jsx to ensure consistent rendering)
const markdownToHtml = (markdown) => {
    if (!markdown) return '';

    // Convert **Bold** and *Italic*
    let html = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert lists starting with * or - to <ul><li>
    let lines = html.split('\n');
    let inList = false;
    let newHtml = '';

    lines.forEach(line => {
        if (line.match(/^[\*\-]\s/)) {
            if (!inList) {
                newHtml += '<ul>';
                inList = true;
            }
            newHtml += `<li>${line.replace(/^[\*\-]\s/, '').trim()}</li>`;
        } else {
            if (inList) {
                newHtml += '</ul>';
                inList = false;
            }
            // Simple paragraph conversion (if not a list)
            if (line.trim().length > 0) {
                newHtml += `<p>${line.trim()}</p>`;
            }
        }
    });

    if (inList) {
        newHtml += '</ul>';
    }

    return newHtml;
};
// --- End Markdown Helper ---


const initialMessage = { sender: 'model', text: "Hello! I'm Agent Compass. I can explain concepts or help you find resources. What are you studying today?" };

const Chat = () => {
    const [messages, setMessages] = useState(() => {
        // Load history from localStorage on mount
        const savedHistory = localStorage.getItem(CHAT_STORAGE_KEY);
        if (savedHistory) {
            return JSON.parse(savedHistory);
        }
        return [initialMessage];
    });

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    // Effect to scroll to bottom and save history
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        // Save history to localStorage whenever messages change
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }, [messages, isTyping]);


    const handleSend = async () => {
        if (input.trim() === '' || isTyping) return;

        const userMessageText = input.trim();
        
        // 1. Optimistic Update: Add user message to history
        const newUserMessage = { sender: 'user', text: userMessageText };
        setMessages((prev) => [...prev, newUserMessage]);
        
        setInput('');
        setIsTyping(true); // Show "Agent is typing" indicator

        try {
            // 2. Prepare history for the API call
            const history = messages.map(({ sender, text }) => ({
                sender: sender === 'user' ? 'user' : 'model',
                text: text
            }));

            // 3. Send message and history to backend
            const response = await fetch(API_BASE_URL + '/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Append the latest user message to the history for the API call
                body: JSON.stringify({ message: userMessageText, history: history }), 
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.text || data.message || 'Failed to get AI response.');
            }

            // 4. Add the AI response to the messages
            const agentResponse = { sender: 'model', text: data.text };
            setMessages((prev) => [...prev, agentResponse]);

        } catch (error) {
            console.error('Chat API Error:', error);
            // Display error to the user as an agent message
            const errorMessage = { 
                sender: 'model', 
                text: `Sorry, I ran into an error: ${error.message}. Please try again later or check the backend server.` 
            };
            setMessages((prev) => [...prev, errorMessage]);

        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="chat-container">
            <h2>Agent Compass Chat</h2>
            <div className="chat-box">
                <div className="message-history">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender === 'user' ? 'student' : 'agent'}`}>
                            <div className="message-bubble">
                                {/* Conditional Rendering: Markdown for Agent, Plain Text for User */}
                                {msg.sender === 'model' ? (
                                    <div 
                                        dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }} 
                                    />
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="message agent">
                            <div className="message-bubble typing-indicator">
                                Agent is typing...
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>
            </div>
            <div className="chat-input-area">
                <input
                    type="text"
                    placeholder="Ask your agent a course question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isTyping}
                />
                <button onClick={handleSend} disabled={isTyping}>
                    {isTyping ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default Chat;