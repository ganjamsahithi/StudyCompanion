// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
  .then(() => console.log('MongoDB connection established successfully.'))
  .catch(err => console.log('MongoDB connection error: ' + err));

// --- Route Imports ---
const tasksRouter = require('./routes/tasks');
const documentsRouter = require('./routes/documents');
const chatRouter = require('./routes/chat');
const dashboardRouter = require('./routes/dashboard');
const examRouter = require('./routes/exam');

// Load Mongoose models (ensures models are defined)
require('./models/chatThread.model');
require('./models/document.model');
require('./models/task.model');

// --- Route Usage ---
app.use('/tasks', tasksRouter);
app.use('/documents', documentsRouter);
app.use('/chat', chatRouter);
app.use('/dashboard', dashboardRouter);
app.use('/exam', examRouter);

// Define a default route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});