// backend/services/whatsapp.service.js
const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Your Twilio WhatsApp sender number

const client = twilio(accountSid, authToken);

/**
 * Sends an urgent alert via WhatsApp (requires Twilio setup).
 */
async function sendWhatsAppAlert(recipientNumber, message) {
    if (!accountSid || !authToken) {
        console.warn("Twilio credentials not fully set in .env. Skipping WhatsApp alert.");
        return;
    }
    
    const recipientWhatsapp = `whatsapp:${recipientNumber}`;
    const senderWhatsapp = `whatsapp:${twilioNumber}`;

    try {
        const result = await client.messages.create({
            body: `[Agent Compass Alert]\n${message}`,
            from: senderWhatsapp, 
            to: recipientWhatsapp,
        });
        console.log(`WhatsApp message sent to ${recipientNumber}: ${result.sid}`);
    } catch (error) {
        console.error('Twilio/WhatsApp Error:', error);
    }
}

module.exports = { sendWhatsAppAlert };