// src/components/Shared/NotificationBadge.jsx
import React from 'react';
import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000/dashboard';

// Helper function to check if two dates are the same day (ignoring time)
const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    // Normalize time fields to ensure only date components are compared
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
}

const NotificationBadge = () => {
    const [alertCount, setAlertCount] = useState(0);

    // Function to request permission from the browser
    const requestNotificationPermission = useCallback(() => {
        if (!("Notification" in window)) {
            console.warn("Browser does not support desktop notification.");
            return;
        }
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    const triggerNotifications = (deadlines) => {
        if (Notification.permission !== "granted") return;

        deadlines.forEach(deadline => {
            // Check if the deadline is today AND the deadline hasn't passed yet (optional check)
            if (isToday(deadline.dueDate) && new Date(deadline.dueDate) > new Date()) { 
                // Trigger a desktop notification for tasks due TODAY
                new Notification(`🔔 DUE TODAY: ${deadline.taskName}`, {
                    body: `Course: ${deadline.courseName}. Don't miss this deadline!`,
                    icon: 'path/to/icon.png' // Placeholder for a small icon
                });
            }
        });
    }

    const fetchAlerts = async () => {
        try {
            const response = await fetch(API_BASE_URL + '/data');
            if (!response.ok) throw new Error('Failed to fetch dashboard data for alerts.');
            
            const data = await response.json();
            
            // The dashboard API returns all upcoming deadlines (within 7 days)
            const deadlines = data.upcomingDeadlines || [];
            
            // 1. Trigger desktop alerts for items due TODAY
            triggerNotifications(deadlines);

            // 2. Set the badge count based on ALL upcoming deadlines
            setAlertCount(deadlines.length);

        } catch (error) {
            console.error("Notification Fetch Error:", error);
            setAlertCount(0); // Reset count on error
        }
    };

    // 1. Request permission on component mount
    useEffect(() => {
        requestNotificationPermission();
    }, [requestNotificationPermission]);

    // 2. Fetch alerts immediately and then every 60 seconds (polling)
    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Poll every minute
        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);

    if (alertCount === 0) return null;

    return (
        <span className="notification-badge" title={`${alertCount} upcoming deadlines!`}>
            {alertCount}
            {/* Inline CSS for the badge, as it's a small functional component */}
            <style jsx="true">{`
                .notification-badge {
                    position: absolute;
                    top: -5px; 
                    right: -5px; 
                    background-color: #dc3545;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    min-width: 20px;
                    text-align: center;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                    box-sizing: border-box;
                    line-height: 1.3;
                }
            `}</style>
        </span>
    );
};

export default NotificationBadge;