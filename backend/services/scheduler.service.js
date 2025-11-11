// backend/services/scheduler.service.js (Finalized Email-Only Logic)

const Assignment = require('../models/Document'); // Adjust model path if needed
const UserSettings = require('../models/user_settings.model');
const emailService = require('./email.service');
const moment = require('moment'); 

// Time thresholds for external alerts (Hours)
const CRITICAL_EMAIL_HOURS = 12; 
const PREP_START_DAYS = 7; 
const PREP_START_HOURS = PREP_START_DAYS * 24;

// --- Helper to fetch tasks due soon ---
async function get_tasks_due_or_starting_prep(userId) {
    const sevenDaysFromNow = moment().add(PREP_START_DAYS, 'days').toDate();
    
    // NOTE: This query fetches documents that are pending and due within the next 7 days.
    return Assignment.find({ 
        userId: userId,
        status: 'pending',
        dueDate: { $lte: sevenDaysFromNow } 
    }).exec();
}

// Helper to generate an HTML email body
function generateEmailBody(task, hours, isCritical) {
    const days = Math.ceil(hours / 24);
    const urgencyStyle = isCritical ? 'style="color: #dc3545; font-weight: bold;"' : '';
    
    // Ensure we use a sensible name and course, falling back to placeholders if null
    const taskName = task.name || task.fileName || 'Pending Assignment'; 
    const courseName = task.course || 'General';

    return `
        <div ${urgencyStyle}>
            <h1>Agent Compass ${isCritical ? 'FINAL WARNING' : 'Reminder'}</h1>
            <p>Your task <strong>${taskName}</strong> for <strong>${courseName}</strong> is due in ${days} day${days > 1 ? 's' : ''}.</p>
            ${isCritical ? '<p>***THIS IS A CRITICAL DEADLINE. LOGIN NOW.***</p>' : '<p>Please log in to the dashboard to review your study materials.</p>'}
        </div>
    `;
}

async function checkAndSendExternalAlerts() {
    // NOTE: Hardcoded user ID must be updated when authentication is implemented
    const userId = 'default_user'; 
    
    const tasks = await get_tasks_due_or_starting_prep(userId); 
    const userSettings = await UserSettings.findOne({ userId });

    if (!userSettings || !userSettings.preferences.emailAlerts || !userSettings.email) {
        console.log(`Skipping external alerts: User settings missing or email disabled.`);
        return; 
    }
    
    const userEmail = userSettings.email;

    for (const task of tasks) {
        // Use moment to safely convert and calculate time difference
        const timeRemainingHours = moment(task.dueDate).diff(moment(), 'hours');
        
        // Skip if the deadline has already passed
        if (timeRemainingHours <= 0) continue; 
        
        // --- A. Critical Alert (Under 12 hours) ---
        if (timeRemainingHours <= CRITICAL_EMAIL_HOURS) {
            const subject = `🔥 CRITICAL: ${task.fileName || task.name} DUE IN ${timeRemainingHours} HOURS!`;
            const htmlBody = generateEmailBody(task, timeRemainingHours, true); 
            await emailService.sendDeadlineEmail(userEmail, subject, htmlBody);
        }
        
        // --- B. Preparation Alert (Between 12 hours and 7 days) ---
        else if (timeRemainingHours > CRITICAL_EMAIL_HOURS && timeRemainingHours <= PREP_START_HOURS) {
            // Only send this alert if the remaining hours are close to a 24h interval to avoid spam
            if (timeRemainingHours % 24 < 1) { 
                const subject = `ACTION REQUIRED: ${task.fileName || task.name} is approaching its deadline.`;
                const htmlBody = generateEmailBody(task, timeRemainingHours, false);
                await emailService.sendDeadlineEmail(userEmail, subject, htmlBody);
            }
        }
    }
}

module.exports = {
    checkAndSendExternalAlerts,
};