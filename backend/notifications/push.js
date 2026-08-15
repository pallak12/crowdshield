// backend/notifications/push.js
const webpush = require('web-push');

// Send alerts to all registered mobile users
async function sendPushAlert(alert) {
    const subscriptions = await getSubscribedUsers(alert.location.radius);
    
    const payload = {
        title: `⚠️ ${alert.severity} Crowd Alert`,
        message: alert.message,
        url: alert.deep_link
    };
    
    subscriptions.forEach(sub => {
        webpush.sendNotification(sub, JSON.stringify(payload))
            .catch(err => console.error('Push failed:', err));
    });
}