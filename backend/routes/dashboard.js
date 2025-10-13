// backend/routes/dashboard.js
const router = require('express').Router();
const Task = require('../models/task.model');
const Document = require('../models/document.model'); 

// GET /dashboard/data - Fetches all data needed for the student dashboard
router.route('/data').get(async (req, res) => {
    // Determine the date range for priority (e.g., next 7 days)
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    try {
        // --- 1. Tasks & Deadlines (High Priority) ---
        const taskMetrics = await Task.aggregate([
            { $match: { isCompleted: false, dueDate: { $gte: today } } },
            { 
                $group: {
                    _id: null,
                    totalPending: { $sum: 1 },
                    upcomingDeadlines: { 
                        $push: { 
                            $cond: [{ $lte: ["$dueDate", sevenDaysFromNow] }, "$$ROOT", "$$REMOVE"] 
                        } 
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalPending: 1,
                    upcomingDeadlines: {
                        $map: {
                            input: "$upcomingDeadlines",
                            as: "item",
                            in: {
                                taskName: "$$item.taskName",
                                courseName: "$$item.courseName",
                                dueDate: "$$item.dueDate",
                                taskType: "$$item.taskType",
                            }
                        }
                    }
                }
            }
        ]);

        // --- 2. Recent Documents & Summaries ---
        const recentDocuments = await Document.find()
            .select('fileName summary uploadedDate')
            .sort({ uploadedDate: -1 })
            .limit(3);

        // --- 3. Workload Meter (Overall Status) ---
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ isCompleted: true });
        
        const workloadPercentage = totalTasks > 0 
            ? Math.round((completedTasks / totalTasks) * 100) 
            : 0;


        // --- Final Response ---
        res.json({
            workloadPercentage: workloadPercentage,
            upcomingDeadlines: taskMetrics[0]?.upcomingDeadlines.sort((a, b) => a.dueDate - b.dueDate) || [],
            recentSummaries: recentDocuments,
            // NOTE: Weakness Profile/Prep Materials will be simulated in the frontend for now
        });

    } catch (error) {
        console.error('Error in Dashboard API:', error);
        res.status(500).json({ message: 'Failed to retrieve dashboard data.' });
    }
});

module.exports = router;