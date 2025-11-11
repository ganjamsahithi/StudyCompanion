// // backend/server.js
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// require('dotenv').config();


// const app = express();
// const port = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// const uri = process.env.MONGODB_URI;
// mongoose.connect(uri)
//   .then(() => console.log('MongoDB connection established successfully.'))
//   .catch(err => console.log('MongoDB connection error: ' + err));

// // --- Route Imports ---
// const tasksRouter = require('./routes/tasks');
// const documentsRouter = require('./routes/documents');
// const chatRouter = require('./routes/chat');
// const dashboardRouter = require('./routes/dashboard');
// const examRouter = require('./routes/exam');
// const quizRoutes = require('./routes/quiz');
// const settingsRouter = require('./routes/settings'); // <--- NEW IMPORT

// // Load Mongoose models (ensures models are defined)
// require('./models/chatThread.model');
// require('./models/document.model');
// require('./models/task.model');

// // --- Route Usage ---
// app.use('/quiz', quizRoutes);
// app.use('/tasks', tasksRouter);
// app.use('/documents', documentsRouter);
// app.use('/chat', chatRouter);
// app.use('/dashboard', dashboardRouter);
// app.use('/exam', examRouter);
// app.use('/settings', settingsRouter); // <--- NEW ROUTE USAGE

// // Define a default route
// app.get('/', (req, res) => {
//   res.send('Backend is running!');
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server is running on port: ${port}`);
// });

// backend/server.js
// COPY THIS ENTIRE FILE - This version handles dashboard correctly

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// =====================
// DATABASE
// =====================
const uri = process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connection established successfully.'))
  .catch(err => console.log('MongoDB connection error: ' + err));

// --- Route Imports ---
const tasksRouter = require('./routes/tasks');
const documentsRouter = require('./routes/documents'); 
const chatRouter = require('./routes/chat');         

// Load Chat Thread model to ensure it's defined before routing
require('./models/chatThread.model'); 

// --- Route Usage ---
app.use('/tasks', tasksRouter);
app.use('/documents', documentsRouter); 
app.use('/chat', chatRouter);         

// Define a default route
app.get('/', (req, res) => {
  res.json({
    message: 'Agent Compass Backend is running',
    port: port,
    routes: {
      dashboard: '/api/dashboard/stats',
      tasks: '/api/tasks',
      documents: '/api/documents',
      chat: '/api/chat',
      quiz: '/api/quiz',
      exam: '/api/exam'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =====================
// 404 HANDLER
// =====================
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requested: req.originalUrl,
    availableRoutes: [
      '/api/dashboard/stats',
      '/api/tasks',
      '/api/documents',
      '/api/chat',
      '/api/quiz',
      '/api/exam'
    ]
  });
});

// =====================
// ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// =====================
// START SERVER
// =====================
const server = app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════╗
║     ✓ Server Running Successfully      ║
║     Base URL: http://localhost:${port}     ║
║     Ready to accept requests           ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});
EOF
