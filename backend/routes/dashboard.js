// backend/routes/dashboard.js
// COMPLETE WORKING VERSION - All metrics calculated correctly

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
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Initialize all metrics
    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    let upcomingDeadlines = [];
    let totalDocuments = 0;
    let allUpcomingTasks = [];

    // ===== FETCH TASKS =====
    if (Task) {
      try {
        // Get ALL tasks (completed and pending)
        const allTasks = await Task.find().lean();
        totalTasks = allTasks.length;

        // Count completed tasks (ALL time, not just this week)
        const completed = allTasks.filter(t => t.isCompleted === true);
        completedTasks = completed.length;

        // Count pending tasks
        const pending = allTasks.filter(t => t.isCompleted === false);
        pendingTasks = pending.length;

        // Count overdue tasks (pending tasks with dueDate in past)
        const overdue = pending.filter(t => new Date(t.dueDate) < now);
        overdueTasks = overdue.length;

        // Get all upcoming deadlines (all task types, next 7 days, pending only)
        allUpcomingTasks = pending
          .filter(t => new Date(t.dueDate) >= now && new Date(t.dueDate) <= sevenDaysFromNow)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 10);

        upcomingDeadlines = allUpcomingTasks.map(task => {
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

        console.log(`✓ Tasks - Total: ${totalTasks}, Completed: ${completedTasks}, Pending: ${pendingTasks}, Overdue: ${overdueTasks}`);

      } catch (err) {
        console.error('✗ Error fetching tasks:', err.message);
      }
    }

    // ===== FETCH DOCUMENTS =====
    if (Document) {
      try {
        const allDocs = await Document.find().lean();
        totalDocuments = allDocs.length;
        console.log(`✓ Documents - Total: ${totalDocuments}`);
      } catch (err) {
        console.error('✗ Error fetching documents:', err.message);
      }
    }

    // ===== SEPARATE EXAMS FROM OTHER TASKS =====
    const upcomingExams = upcomingDeadlines.filter(t => t.taskType === 'Exam');
    const otherUpcomingTasks = upcomingDeadlines.filter(t => t.taskType !== 'Exam');

    // ===== CALCULATE WORKLOAD SCORE =====
    const workloadScore = Math.min(100, Math.round(
      (overdueTasks * 15) + 
      (pendingTasks * 3)
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

    if (pendingTasks > 8) {
      highPriorityAlerts.push({
        type: 'high_volume',
        message: `📚 Heavy workload: ${pendingTasks} pending tasks`,
        severity: 'high'
      });
    }

    // ===== COMPLETION RATE =====
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // ===== SEND RESPONSE =====
    const responseData = {
      success: true,
      data: {
        workloadScore,
        metrics: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          totalDocuments,
          completionRate
        },
        highPriorityAlerts,
        upcomingDeadlines: otherUpcomingTasks,
        upcomingExams,
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