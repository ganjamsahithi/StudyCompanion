// backend/routes/settings.js
const router = require('express').Router();
const UserSettings = require('../models/user_settings.model');
const fs = require('fs');

// POST /settings - Update User Preferences
router.route('/').post(async (req, res) => {
    const { userId, email, phoneNumber, preferences } = req.body;
    
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        // Find and update, or create if not found (upsert: true)
        const settings = await UserSettings.findOneAndUpdate(
            { userId: userId },
            { 
                $set: { 
                    email: email, 
                    phoneNumber: phoneNumber, 
                    preferences: preferences 
                } 
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ 
            message: 'Settings saved successfully.',
            settings: settings 
        });

    } catch (error) {
        console.error('Error saving user settings:', error);
        res.status(500).json({ message: 'Failed to save settings.', error: error.message });
    }
});

module.exports = router;