// backend/services/email.service.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration for Nodemailer (using SMTP service like Gmail or SendGrid)
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends a detailed email alert for preparation or deadlines.
 */
async function sendDeadlineEmail(recipient, subject, htmlBody) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("EMAIL_USER or EMAIL_PASS not set in .env. Skipping email sending.");
        return;
    }
    
    const mailOptions = {
        from: `"Agent Compass" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: subject,
        html: htmlBody,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${recipient}: ${info.response}`);
    } catch (error) {
        console.error('Nodemailer Error:', error);
    }
}

module.exports = { sendDeadlineEmail };