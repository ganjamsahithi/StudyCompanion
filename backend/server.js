// backend/server.js
/**
 * Complete server entry for StudyCompanion backend.
 * - Minimal, explicit, and robust setup
 * - Mounts routes: tasks, documents, chat, dashboard, exam, quiz, settings (if present)
 *
 * If you have route files with slightly different names, update the 'require' paths below.
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// -----------------------
// Middleware
// -----------------------
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploads directory (so summarized files, previews, etc. can be accessed if needed)
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// -----------------------
// Database connection
// -----------------------
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studycompanion';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connection established successfully.'))
.catch(err => {
  console.error('MongoDB connection error:', err && err.message ? err.message : err);
});

// -----------------------
// Load models (ensure they're registered)
// -----------------------
try {
  require('./models/document.model');
} catch (e) { /* ignore if model file not present yet */ }

try {
  require('./models/task.model');
} catch (e) { /* ignore if model file not present yet */ }

try {
  require('./models/chatThread.model');
} catch (e) { /* ignore if model file not present yet */ }

// -----------------------
// Route imports (safe)
// -----------------------
function safeRequire(routePath, friendlyName) {
  try {
    return require(routePath);
  } catch (err) {
    console.warn(`Warning: could not load ${friendlyName} at "${routePath}". If you need this route, create that file. Error: ${err.message}`);
    return null;
  }
}

const tasksRouter = safeRequire('./routes/tasks', 'tasks router');
const documentsRouter = safeRequire('./routes/documents', 'documents router');
const chatRouter = safeRequire('./routes/chat', 'chat router');

// Dashboard router naming can vary in different repos; try common names
let dashboardRouter = safeRequire('./routes/dashboard', 'dashboard router (./routes/dashboard)');
if (!dashboardRouter) dashboardRouter = safeRequire('./routes/dashboard.routes', 'dashboard router (./routes/dashboard.routes)');

const examRouter = safeRequire('./routes/exam', 'exam router');
const quizRouter = safeRequire('./routes/quiz', 'quiz router');
const settingsRouter = safeRequire('./routes/settings', 'settings router');

// -----------------------
// Mount routes (only if present)
// -----------------------
if (tasksRouter) app.use('/tasks', tasksRouter);
if (documentsRouter) app.use('/documents', documentsRouter);
if (chatRouter) app.use('/chat', chatRouter);

// Mount dashboard both as /dashboard and /api/dashboard if available
if (dashboardRouter) {
  app.use('/dashboard', dashboardRouter);
  app.use('/api/dashboard', dashboardRouter);
}

if (examRouter) app.use('/exam', examRouter);
if (quizRouter) app.use('/quiz', quizRouter);
if (settingsRouter) app.use('/settings', settingsRouter);

// -----------------------
// Default root and simple health endpoints
// -----------------------
app.get('/', (req, res) => {
  res.json({
    message: 'StudyCompanion backend is running',
    env: process.env.NODE_ENV || 'development',
    port,
    routes: {
      documents: '/documents',
      tasks: '/tasks',
      chat: '/chat',
      dashboard: '/dashboard',
      exam: '/exam',
      quiz: '/quiz'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// -----------------------
// 404 handler (last non-error middleware)
// -----------------------
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requested: req.originalUrl,
  });
});

// -----------------------
// Error handler
// -----------------------
app.use((err, req, res, next) => {
  console.error('❌ Unhandled server error:', err && err.stack ? err.stack : err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    // include stack in non-production for debugging
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
});

// -----------------------
// Start server
// -----------------------
const server = app.listen(port, () => {
  console.log(`\nServer started at http://localhost:${port} (NODE_ENV=${process.env.NODE_ENV || 'development'})`);
  console.log('Mounted routes:');
  if (tasksRouter) console.log(' - /tasks');
  if (documentsRouter) console.log(' - /documents');
  if (chatRouter) console.log(' - /chat');
  if (dashboardRouter) console.log(' - /dashboard  and /api/dashboard');
  if (examRouter) console.log(' - /exam');
  if (quizRouter) console.log(' - /quiz');
  if (settingsRouter) console.log(' - /settings');
  console.log('');
});

// Graceful shutdown
function gracefulShutdown() {
  console.log('Received shutdown signal, closing server...');
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });

  // Force exit if still not closed after 10s
  setTimeout(() => {
    console.warn('Forcing shutdown.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Export app for testing if needed
module.exports = app;
