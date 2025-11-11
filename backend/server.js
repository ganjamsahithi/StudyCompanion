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
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✓ MongoDB connection established successfully'))
  .catch(err => console.error('✗ MongoDB error:', err));

// =====================
// LOAD MODELS
// =====================
console.log('\n📦 Loading models...');
require('./models/chatThread.model');
console.log('  ✓ ChatThread model loaded');

require('./models/document.model');
console.log('  ✓ Document model loaded');

require('./models/task.model');
console.log('  ✓ Task model loaded');

try {
  require('./models/QuizResult.model');
  console.log('  ✓ QuizResult model loaded');
} catch (e) {
  console.log('  ⚠ QuizResult model optional');
}

// =====================
// IMPORT ROUTES
// =====================
console.log('\n🛣️  Importing route files...');

const tasksRouter = require('./routes/tasks');
console.log('  ✓ Tasks router imported');

const documentsRouter = require('./routes/documents');
console.log('  ✓ Documents router imported');

const chatRouter = require('./routes/chat');
console.log('  ✓ Chat router imported');

// DASHBOARD - This is the critical part
let dashboardRouter = null;
try {
  dashboardRouter = require('./routes/dashboard');
  console.log('  ✓ Dashboard router imported');
} catch (error) {
  console.error('  ✗ ERROR loading dashboard router:', error.message);
  console.error('     Make sure backend/routes/dashboard.js exists!');
}

const examRouter = require('./routes/exam');
console.log('  ✓ Exam router imported');

const quizRoutes = require('./routes/quiz');
console.log('  ✓ Quiz router imported');

// =====================
// REGISTER ROUTES
// =====================
console.log('\n📡 Registering routes...');

// Tasks
app.use('/tasks', tasksRouter);
app.use('/api/tasks', tasksRouter);
console.log('  ✓ Tasks routes registered');

// Documents
app.use('/documents', documentsRouter);
app.use('/api/documents', documentsRouter);
console.log('  ✓ Documents routes registered');

// Chat
app.use('/chat', chatRouter);
app.use('/api/chat', chatRouter);
console.log('  ✓ Chat routes registered');

// DASHBOARD - Make sure this is registered
if (dashboardRouter) {
  app.use('/dashboard', dashboardRouter);
  app.use('/api/dashboard', dashboardRouter);
  console.log('  ✓ Dashboard routes registered at /dashboard and /api/dashboard');
} else {
  console.error('  ✗ Dashboard router NOT registered - file may be missing!');
}

// Exam
app.use('/exam', examRouter);
app.use('/api/exam', examRouter);
console.log('  ✓ Exam routes registered');

// Quiz
app.use('/quiz', quizRoutes);
app.use('/api/quiz', quizRoutes);
console.log('  ✓ Quiz routes registered');

// =====================
// TEST ROUTES
// =====================
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