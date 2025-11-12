// backend/routes/dashboard.js

const express = require('express');
const router = express.Router();

let Task = null;
let Document = null;

try {
  Task = require('../models/task.model');
} catch (error) {}

try {
  Document = require('../models/document.model');
} catch (error) {}

/**
 * GET /stats - Get dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Dashboard stats requested');
    
    const now = new Date();

    // Initialize all metrics
    let totalTasks = 0;
    let overdueTasks = 0;
    let totalDocuments = 0;
    let summarizedDocuments = 0;
    let upcomingTasks = [];
    let upcomingExams = [];

    // ===== FETCH TASKS =====
    if (Task) {
      try {
        // Get ALL tasks
        const allTasks = await Task.find().lean();
        totalTasks = allTasks.length;

        // Count overdue tasks (tasks with dueDate in past)
        const overdue = allTasks.filter(t => new Date(t.dueDate) < now);
        overdueTasks = overdue.length;

        // Get all future tasks sorted by date
        const allFutureTasks = allTasks
          .filter(t => new Date(t.dueDate) >= now)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Separate exams from other tasks
        upcomingExams = allFutureTasks
          .filter(t => t.taskType === 'Exam')
          .slice(0, 20)
          .map(task => {
            const daysUntil = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
            return {
              id: task._id,
              courseName: task.courseName || 'General',
              taskName: task.taskName || 'Untitled Task',
              taskType: task.taskType,
              dueDate: task.dueDate,
              daysUntil: Math.max(0, daysUntil)
            };
          });

        // All non-exam upcoming tasks
        upcomingTasks = allFutureTasks
          .filter(t => t.taskType !== 'Exam')
          .slice(0, 20)
          .map(task => {
            const daysUntil = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
            return {
              id: task._id,
              courseName: task.courseName || 'General',
              taskName: task.taskName || 'Untitled Task',
              taskType: task.taskType || 'Task',
              dueDate: task.dueDate,
              daysUntil: Math.max(0, daysUntil)
            };
          });

        console.log(`✓ Tasks - Total: ${totalTasks}, Overdue: ${overdueTasks}, Upcoming: ${upcomingTasks.length}`);

      } catch (err) {
        console.error('✗ Error fetching tasks:', err.message);
      }
    }

    // ===== FETCH DOCUMENTS =====
    if (Document) {
      try {
        const allDocs = await Document.find().lean();
        totalDocuments = allDocs.length;
        
        // Count documents with summaries
        summarizedDocuments = allDocs.filter(doc => doc.summary && doc.summary.trim().length > 0).length;
        
        console.log(`✓ Documents - Total: ${totalDocuments}, Summarized: ${summarizedDocuments}`);
      } catch (err) {
        console.error('✗ Error fetching documents:', err.message);
      }
    }

    // ===== CALCULATE WORKLOAD SCORE =====
    const workloadScore = Math.min(100, Math.round(
      (overdueTasks * 15) + 
      (totalTasks * 3)
    ));

    // ===== BUILD ALERTS =====
    const highPriorityAlerts = [];

    if (overdueTasks > 0) {
      highPriorityAlerts.push({
        type: 'overdue',
        message: `⚠️ You have ${overdueTasks} overdue task(s)!`,
        severity: 'critical'
      });
    }

    if (totalTasks > 8) {
      highPriorityAlerts.push({
        type: 'high_volume',
        message: `📚 Heavy workload: ${totalTasks} total tasks`,
        severity: 'high'
      });
    }

    // ===== SEND RESPONSE =====
    const responseData = {
      success: true,
      data: {
        workloadScore,
        metrics: {
          totalTasks,
          overdueTasks,
          totalDocuments,
          summarizedDocuments
        },
        highPriorityAlerts,
        upcomingTasks,        // All non-exam tasks
        upcomingExams,        // Only exams
        wellnessProfile: {
          conceptsReviewed: 0,
          topWeakAreas: [],
          recentQuizCount: 0
        },
        recentSummaries: [],
        examPredictions: upcomingExams
      }
    };

    console.log('✓ Dashboard stats sent successfully');
    return res.json(responseData);

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard statistics',
      error: error.message 
    });
  }
});

/**
 * GET /health - Health check
 */
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Dashboard route operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;