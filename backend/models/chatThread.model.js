// backend/models/chatThread.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for a single message within the thread
const messageSchema = new Schema({
  sender: { type: String, required: true, enum: ['user', 'model'] }, // 'user' or 'model' (Agent Compass)
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Schema for the entire conversation thread
const chatThreadSchema = new Schema({
  // Unique ID for MongoDB is automatic
  // A title generated from the first user message
  title: { type: String, required: true, default: 'New Chat' }, 
  // An array containing all messages in this thread
  messages: [messageSchema],
  // Placeholder user ID (will use real auth later)
  userId: { type: String, required: true, default: 'default_user' }, 
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
module.exports = ChatThread;