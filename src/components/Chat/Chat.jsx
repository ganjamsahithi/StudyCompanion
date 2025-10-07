import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([
    { sender: 'A', text: "Hello! I'm Agent Compass. I can explain concepts or help you find resources. What are you studying today?" },
    { sender: 'S', text: "I'm working on Binary Trees for CS 301. Can you explain the difference between DFS and BFS?" },
    { sender: 'A', text: "Of course! DFS (Depth-First Search) explores as far as possible along each branch before backtracking. BFS (Breadth-First Search) explores all neighbor nodes at the present depth prior to moving on to the nodes at the next depth level." },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() === '') return;

    const newUserMessage = { sender: 'S', text: input.trim() };
    setMessages((prev) => [...prev, newUserMessage]);
    
    setInput('');
    
    // Simulate agent's response
    setTimeout(() => {
        const agentResponse = { sender: 'A', text: `Got it! I've searched your notes and found a relevant summary on graph theory to help you practice: [Link to Practice Summary].` };
        setMessages((prev) => [...prev, agentResponse]);
    }, 1500);
  };

  return (
    <div className="chat-container">
      <h2>Agent Compass Chat</h2>
      <div className="chat-box">
        <div className="message-history">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender === 'S' ? 'student' : 'agent'}`}>
              <div className="message-bubble">
                {msg.text}
              </div>
            </div>
          ))}
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
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chat;