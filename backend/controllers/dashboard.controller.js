// backend/controllers/dashboard.controller.js
const Task = require('../models/Task');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all tasks
    const allTasks = await Task.find({});
    const pendingTasks = allTasks.filter(task => !task.isCompleted);
    const completedTasks = allTasks.filter(task => task.isCompleted);

    // Get overdue tasks
    const overdueTasks = pendingTasks.filter(task => new Date(task.dueDate) < now);

    // Get tasks due today
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    const dueTodayTasks = pendingTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= todayEnd;
    });

    // Get upcoming deadlines (next 7 days)
    const upcomingTasks = pendingTasks
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    // Format upcoming deadlines
    const upcomingDeadlines = upcomingTasks.map(task => {
      const dueDate = new Date(task.dueDate);
      const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      const iconMap = {
        'Assignment': '📝',
        'Exam': '📚',
        'Project': '🎯',
        'Reading': '📖',
        'Review': '🔄'
      };

      return {
        id: task._id,
        taskName: task.taskName,
        courseName: task.courseName,
        taskType: task.taskType,
        dueDate: task.dueDate,
        daysUntil: daysUntil,
        icon: iconMap[task.taskType] || '📌'
      };
    });

    // Get exam predictions (exams in next 7 days)
    const upcomingExams = pendingTasks
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return task.taskType === 'Exam' && dueDate >= now && dueDate <= sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const examPredictions = upcomingExams.map(exam => {
      const dueDate = new Date(exam.dueDate);
      const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        courseName: exam.courseName,
        examDate: exam.dueDate,
        daysUntil: daysUntil,
        taskName: exam.taskName
      };
    });

    // Calculate workload score (0-100)
    let workloadScore = 0;
    
    // Factors for workload calculation
    const overdueWeight = 15;
    const dueTodayWeight = 20;
    const upcomingWeight = 10;
    const totalTasksWeight = 5;

    workloadScore += Math.min(overdueTasks.length * overdueWeight, 40);
    workloadScore += Math.min(dueTodayTasks.length * dueTodayWeight, 30);
    workloadScore += Math.min(upcomingTasks.length * upcomingWeight, 20);
    workloadScore += Math.min(pendingTasks.length * totalTasksWeight, 10);

    workloadScore = Math.min(Math.round(workloadScore), 100);

    // Generate high-priority alerts
    const highPriorityAlerts = [];

    if (overdueTasks.length > 0) {
      highPriorityAlerts.push({
        message: `⚠️ <strong>${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}</strong> - Immediate action required!`,
        severity: 'critical'
      });
    }

    if (dueTodayTasks.length > 0) {
      highPriorityAlerts.push({
        message: `🔥 <strong>${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} due TODAY</strong> - Complete before midnight!`,
        severity: 'urgent'
      });
    }

    const examsDueIn3Days = pendingTasks.filter(task => {
      if (task.taskType !== 'Exam') return false;
      const dueDate = new Date(task.dueDate);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    });

    if (examsDueIn3Days.length > 0) {
      examsDueIn3Days.forEach(exam => {
        const dueDate = new Date(exam.dueDate);
        const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        highPriorityAlerts.push({
          message: `📚 <strong>${exam.courseName} Exam</strong> in ${daysUntil} day${daysUntil > 1 ? 's' : ''} - Start intensive revision!`,
          severity: 'warning'
        });
      });
    }

    // Get completed tasks this week
    const completedThisWeek = completedTasks.filter(task => {
      const completedDate = task.createdAt || task.dueDate;
      return new Date(completedDate) >= oneWeekAgo;
    }).length;

    // Mock data for features not yet implemented
    const wellnessProfile = {
      conceptsReviewed: 0, // Will be populated when quiz/study tracking is implemented
      topWeakAreas: [], // Will be populated from quiz results
      recentQuizCount: 0 // Will be populated from quiz history
    };

    const recentSummaries = []; // Will be populated when document upload is implemented

    // Metrics
    const metrics = {
      totalPendingTasks: pendingTasks.length,
      completedThisWeek: completedThisWeek,
      overdueCount: overdueTasks.length,
      dueTodayCount: dueTodayTasks.length
    };

    // Send response
    res.status(200).json({
      success: true,
      data: {
        workloadScore,
        metrics,
        highPriorityAlerts,
        upcomingDeadlines,
        wellnessProfile,
        recentSummaries,
        examPredictions
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Additional endpoint for task analytics
exports.getTaskAnalytics = async (req, res) => {
  try {
    const tasks = await Task.find({});
    
    // Tasks by type
    const tasksByType = {};
    tasks.forEach(task => {
      tasksByType[task.taskType] = (tasksByType[task.taskType] || 0) + 1;
    });

    // Tasks by course
    const tasksByCourse = {};
    tasks.forEach(task => {
      tasksByCourse[task.courseName] = (tasksByCourse[task.courseName] || 0) + 1;
    });

    // Completion rate
    const completed = tasks.filter(t => t.isCompleted).length;
    const completionRate = tasks.length > 0 ? (completed / tasks.length * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        tasksByType,
        tasksByCourse,
        completionRate,
        totalTasks: tasks.length
      }
    });

  } catch (error) {
    console.error('Task analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task analytics',
      error: error.message
    });
  }
};