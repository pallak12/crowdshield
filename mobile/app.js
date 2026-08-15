// mobile/app.js

// 1. Location-based warnings
async function getLocationAndAlerts() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Check for nearby crowd alerts
            const response = await fetch(`https://api.crowdshield.com/alerts/nearby?lat=${latitude}&lng=${longitude}`);
            const alerts = await response.json();
            
            if (alerts.length > 0) {
                displayAlerts(alerts);
                sendPushNotification(alerts[0]);
            }
        });
    }
}

// 2. Live congestion alerts
function displayAlerts(alerts) {
    const alertContainer = document.getElementById('alert-list');
    alertContainer.innerHTML = alerts.map(alert => `
        <div class="alert-item priority-${alert.severity}">
            <span class="alert-icon">${alert.icon}</span>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.description}</p>
                <span class="alert-distance">${alert.distance} meters away</span>
            </div>
        </div>
    `).join('');
}

// 3. Incident reporting
function reportIncident() {
    const description = document.getElementById('incident-report').value;
    const location = getCurrentLocation();
    
    fetch('https://api.crowdshield.com/reports', {
        method: 'POST',
        body: JSON.stringify({
            type: 'INCIDENT_REPORT',
            description: description,
            location: location,
            timestamp: new Date().toISOString()
        })
    });
}