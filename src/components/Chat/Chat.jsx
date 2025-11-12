// src/components/Chat/Chat.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chat.css';

const API_BASE_URL = 'http://localhost:5000/chat';

// --- Helper Function: Markdown to HTML Conversion ---
const markdownToHtml = (markdown) => {
    if (!markdown) return '';
    let html = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    let lines = markdown.split('\n');
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

const initialAgentMessage = "Hello! I'm Agent Compass. I can explain concepts or help you find resources. What are you studying today?";

const Chat = () => {
    const [threads, setThreads] = useState([]);
    const [messages, setMessages] = useState([]); 
    const [activeThreadId, setActiveThreadId] = useState(null); 
    
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [loadingThreads, setLoadingThreads] = useState(true);
    
    // Management states
    const [showManagementMenuId, setShowManagementMenuId] = useState(null);
    const [renameInput, setRenameInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false); // NEW STATE for UI lock
    
    const chatEndRef = useRef(null);

    // --- Core Data Fetching ---

    const startNewChatLocally = () => {
        setActiveThreadId(null);
        setMessages([{ sender: 'model', text: initialAgentMessage }]);
        setShowManagementMenuId(null); 
    };
    
    const fetchThreads = useCallback(async () => {
        setLoadingThreads(true);
        try {
            const response = await fetch(API_BASE_URL + '/threads');
            if (!response.ok) {
                console.warn('Failed to fetch threads, using empty array');
                setThreads([]);
                return;
            }
            const data = await response.json();
            // Ensure data is always an array
            setThreads(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching threads:', error);
            setThreads([]); // Set to empty array on error
        } finally {
            setLoadingThreads(false);
        }
    }, []);

    const loadThread = useCallback(async (id) => {
        if (id === activeThreadId) return;

        setActiveThreadId(id);
        setIsTyping(true);
        setMessages([]); 
        setShowManagementMenuId(null); 
        
        try {
            const response = await fetch(API_BASE_URL + `/threads/${id}`);
            const data = await response.json();

            if (!response.ok) throw new Error("Failed to load thread.");

            setMessages(data.messages);
        } catch (error) {
            console.error('Error loading thread messages:', error);
            setMessages([{ sender: 'model', text: "Error loading this chat history. Please try a different thread." }]);
        } finally {
            setIsTyping(false);
        }
    }, [activeThreadId]);

    // Effect 1: Load threads and start new chat on mount
    useEffect(() => {
        fetchThreads();
        startNewChatLocally(); 
    }, []);

    // Effect 2: Scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);


    // --- Management Functions ---

    const handleRename = async (id, newTitle) => {
        const threadToUpdate = threads.find(t => t._id === id);
        const titleToUse = renameInput.trim() || threadToUpdate?.title;
        
        if (!titleToUse || titleToUse.length === 0) {
            setShowManagementMenuId(null); 
            return;
        }

        try {
            const response = await fetch(API_BASE_URL + `/rename/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newTitle: titleToUse })
            });

            if (!response.ok) throw new Error(`Rename failed with status: ${response.status}`);
            
            // Optimistic update of thread list
            setThreads(prev => prev.map(t => 
                t._id === id ? { ...t, title: titleToUse } : t
            ));
            
            // Close rename prompt
            setRenameInput('');
            setShowManagementMenuId(null);

        } catch (error) {
            console.error('Rename Error:', error);
            window.alert('Failed to rename chat. Check console for details.');
        }
    };

    const handleDelete = async (id) => {
        if (isDeleting) return; // Prevent double click

        if (!window.confirm("Are you sure you want to delete this chat history? This action cannot be undone.")) {
            setShowManagementMenuId(null);
            return;
        }
        
        setIsDeleting(true); // Lock the UI
        try {
            setShowManagementMenuId(null); 

            // IMPORTANT: Explicit await for network request
            const response = await fetch(API_BASE_URL + `/delete/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                console.error('Delete Request Failed. Status:', response.status, 'ID:', id);
                throw new Error(`Delete failed with status: ${response.status}`);
            }

            // 1. Remove from thread list (Update UI after confirmed deletion)
            setThreads(prev => prev.filter(t => t._id !== id));
            
            // 2. If the deleted thread was the active one, start a new chat
            if (activeThreadId === id) {
                startNewChatLocally();
            }

        } catch (error) {
            console.error('Delete Error:', error);
            window.alert(`Failed to delete chat. Error: ${error.message}. Please check the backend console.`);
        } finally {
            setIsDeleting(false); // Unlock the UI
        }
    };


    // --- Message Sending Logic ---

    const handleSend = async () => {
        if (input.trim() === '' || isTyping) return;

        const userMessageText = input.trim();
        const currentThreadId = activeThreadId;

        // 1. Optimistic Update
        const newUserMessage = { sender: 'user', text: userMessageText };
        setMessages((prev) => [...prev, newUserMessage]);
        setInput('');
        setIsTyping(true);
        setShowManagementMenuId(null); 

        try {
            // 2. Send message to backend
            const response = await fetch(API_BASE_URL + '/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMessageText, 
                    threadId: currentThreadId
                }), 
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.text || data.message || 'Failed to get AI response.');

            // 3. Handle response and update thread list if new chat
            const agentResponse = { sender: 'model', text: data.text };
            setMessages((prev) => [...prev, agentResponse]);
            
            if (data.newThread) {
                setActiveThreadId(data.threadId);
                fetchThreads(); 
            } else if (currentThreadId) {
                fetchThreads();
            }

        } catch (error) {
            console.error('Chat API Error:', error);
            const errorMessage = { 
                sender: 'model', 
                text: `Sorry, I ran into an error: ${error.message}.` 
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };


    // --- Rendering ---

    return (
        <div className="chat-interface">
            {/* Sidebar for Threads (Left Column) */}
            <div className="chat-sidebar">
                <button 
                    className={`new-chat-btn ${activeThreadId === null ? 'active-new-chat' : ''}`}
                    onClick={startNewChatLocally}
                    disabled={isDeleting}
                >
                    + New Chat
                </button>
                <div className="thread-list-container">
                    {loadingThreads || isDeleting ? (
                        <div className="thread-loading">{isDeleting ? 'Deleting...' : 'Loading chats...'}</div>
                    ) : (
                        threads.map(thread => (
                            <div 
                                key={thread._id} 
                                className={`thread-item ${activeThreadId === thread._id ? 'active' : ''}`}
                            >
                                {/* Thread Content (clickable area) */}
                                <div className="thread-content" onClick={() => loadThread(thread._id)}>
                                    <span className="thread-title">{thread.title}</span>
                                    <span className="thread-date">{new Date(thread.updatedAt).toLocaleDateString()}</span>
                                </div>
                                
                                {/* Management Button (Always visible on the right) */}
                                <button 
                                    className="management-toggle-btn"
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setShowManagementMenuId(showManagementMenuId === thread._id ? null : thread._id);
                                        setRenameInput(thread.title);
                                    }}
                                    disabled={isDeleting}
                                >
                                    ...
                                </button>
                                
                                {/* Management Menu (Conditional visibility) */}
                                {showManagementMenuId === thread._id && (
                                    <div className="thread-management-menu">
                                        <div className="rename-group">
                                            <input
                                                type="text"
                                                className="rename-input"
                                                defaultValue={thread.title}
                                                onChange={(e) => setRenameInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleRename(thread._id, renameInput);
                                                    }
                                                }}
                                                onBlur={(e) => handleRename(thread._id, renameInput)}
                                                onClick={(e) => e.stopPropagation()} 
                                                autoFocus
                                            />
                                            <button 
                                                className="action-icon rename-icon" 
                                                onClick={() => handleRename(thread._id, renameInput)}
                                                title="Save Rename"
                                            >
                                                ✔️
                                            </button>
                                        </div>
                                        <button 
                                            className="action-icon delete-icon" 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(thread._id); }}
                                            title="Delete Chat"
                                            disabled={isDeleting}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Conversation (Right Column) */}
            <div className="chat-main-content">
                <h2>Agent Compass Chat</h2>
                <div className="chat-box">
                    <div className="message-history">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender === 'user' ? 'student' : 'agent'}`}>
                                <div className="message-bubble">
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
                        disabled={isTyping || isDeleting}
                    />
                    <button onClick={handleSend} disabled={isTyping || isDeleting}>
                        {isTyping ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;