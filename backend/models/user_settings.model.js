// backend/models/user_settings.model.js
const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
        required: false,
        trim: true,
    },
    preferences: {
        emailAlerts: { type: Boolean, default: true },
        whatsappAlerts: { type: Boolean, default: false },
    }
}, {
    timestamps: true,
});

const UserSettings = mongoose.model('UserSettings', UserSettingsSchema);

module.exports = UserSettings;