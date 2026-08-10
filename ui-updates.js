/**
 * CROWDSHIELD UI UPDATES
 * Manages all DOM updates, metrics display, and UI state synchronization
 */

class UIManager {
    constructor() {
        try {
            this.cacheElements();
            this.lastUpdateTime = 0;
        } catch (error) {
            console.error('Error initializing UIManager:', error);
        }
    }

    /**
     * Cache DOM elements for better performance
     * @private
     */
    cacheElements() {
        try {
            // Metrics elements
            this.likelihoodGauge = this.safeGetElement('likelihoodGauge');
            this.likelihoodVal = this.safeGetElement('likelihoodVal');
            this.gaugeStatusText = this.safeGetElement('gaugeStatusText');
            this.crushRiskVal = this.safeGetElement('crushRiskVal');
            this.crushRiskCard = this.safeGetElement('crushRiskCard');
            this.panicIndexVal = this.safeGetElement('panicIndexVal');
            this.panicIndexCard = this.safeGetElement('panicIndexCard');
            this.crowdDensityVal = this.safeGetElement('crowdDensityVal');
            this.avgSpeedVal = this.safeGetElement('avgSpeedVal');
            this.bottleneckCountEl = this.safeGetElement('bottleneckCount');

            // System status elements
            this.systemStatusEl = this.safeGetElement('systemStatus');
            this.timeDisplayEl = this.safeGetElement('timeDisplay');

            // Recommendation and logs
            this.recommendationsList = this.safeGetElement('recommendationsList');
            this.logsContent = this.safeGetElement('logsContent');

            // Phone elements
            this.phoneTime = this.safeGetElement('phoneTime');
            this.phoneAlertCard = this.safeGetElement('phoneAlertCard');
            this.phoneAlertIcon = this.safeGetElement('phoneAlertIcon');
            this.phoneAlertTitle = this.safeGetElement('phoneAlertTitle');
            this.phoneAlertDesc = this.safeGetElement('phoneAlertDesc');
            this.audioPlayerStatus = this.safeGetElement('audioPlayerStatus');
            this.announcementWave = this.safeGetElement('announcementWave');

            // Subscribe to state changes
            appState.subscribe('metrics', () => this.updateMetrics());
            appState.subscribe('logs', () => this.updateLogs());
            appState.subscribe('activeRecommendations', () => this.renderRecommendations());
        } catch (error) {
            console.error('Error caching UI elements:', error);
        }
    }

    /**
     * Safely get DOM element
     * @private
     */
    safeGetElement(id) {
        try {
            const el = document.getElementById(id);
            if (!el) {
                console.warn(`Element with id "${id}" not found`);
            }
            return el;
        } catch (error) {
            console.error(`Error getting element ${id}:`, error);
            return null;
        }
    }

    /**
     * Update all metrics display
     */
    updateMetrics() {
        try {
            const now = Date.now();
            // Throttle updates to avoid excessive DOM operations
            if (now - this.lastUpdateTime < CONFIG.UI.UPDATE_INTERVAL) return;
            this.lastUpdateTime = now;

            const metrics = appState.get('metrics');
            if (!metrics) return;

            // Update stampede likelihood gauge
            this.updateGauge(metrics.stampedeLikelihood);

            // Update crush risk
            if (this.crushRiskVal) {
                this.crushRiskVal.innerText = metrics.crushRiskLevel;
                this.crushRiskVal.className = `card-val ${metrics.crushRiskLevel.toLowerCase()}`;
            }

            // Update panic index
            if (this.panicIndexVal) {
                this.panicIndexVal.innerText = Number(metrics.panicIndex || 0).toFixed(2);
            }
 
            // Update crowd density
            if (this.crowdDensityVal) {
                this.crowdDensityVal.innerText = Number(metrics.crowdDensity || 0).toFixed(1) + ' P/m²';
            }
 
            // Update average speed
            if (this.avgSpeedVal) {
                this.avgSpeedVal.innerText = Number(metrics.avgMovementSpeed || 0).toFixed(1) + ' m/s';
            }

            // Update bottleneck count
            if (this.bottleneckCountEl) {
                const bottlenecks = metrics.bottlenecks || 0;
                this.bottleneckCountEl.innerText = bottlenecks + ' Detected';
                this.bottleneckCountEl.className = bottlenecks > 0 ? 'item-val warning-text' : 'item-val';
            }
        } catch (error) {
            console.error('Error updating metrics:', error);
        }
    }

    /**
     * Update gauge visualization
     * @private
     */
    updateGauge(likelihood) {
        try {
            if (!this.likelihoodGauge || !this.likelihoodVal || !this.gaugeStatusText) return;

            const maxDasharray = 126; // SVG path length
            const dashoffset = maxDasharray - (likelihood / 100) * maxDasharray;

            this.likelihoodGauge.setAttribute('stroke-dashoffset', dashoffset);
            this.likelihoodVal.innerText = likelihood + '%';

            // Update gauge color and status
            let status = 'Normal Flow';
            let colorClass = 'safe';

            if (likelihood > CONFIG.RISK.DANGER_THRESHOLD) {
                status = 'CRITICAL RISK';
                colorClass = 'danger';
            } else if (likelihood > CONFIG.RISK.WARNING_THRESHOLD) {
                status = 'HIGH ALERT';
                colorClass = 'warning';
            }

            this.likelihoodGauge.className.baseVal = `gauge-fill ${colorClass}`;
            this.gaugeStatusText.className = `gauge-status ${colorClass}`;
            this.gaugeStatusText.innerText = status;
        } catch (error) {
            console.error('Error updating gauge:', error);
        }
    }

    /**
     * Update logs display
     */
    updateLogs() {
        try {
            if (!this.logsContent) return;

            const logs = appState.get('logs') || [];
            
            // Only update if new logs added (performance optimization)
            const currentCount = this.logsContent.children.length;
            if (currentCount === logs.length) return;

            // Clear and rebuild
            this.logsContent.innerHTML = '';
            
            logs.forEach(log => {
                const entry = document.createElement('div');
                entry.className = `log-entry ${log.type}`;
                
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });

                entry.innerHTML = `
                    <span class="log-time">[${timeStr}]</span>
                    <span class="log-message"><strong>${this.escapeHtml(log.source)}:</strong> ${this.escapeHtml(log.message)}</span>
                `;
                this.logsContent.appendChild(entry);
            });

            this.logsContent.scrollTop = this.logsContent.scrollHeight;
        } catch (error) {
            console.error('Error updating logs:', error);
        }
    }

    /**
     * Render recommendations
     */
    renderRecommendations() {
        try {
            if (!this.recommendationsList) return;

            const recs = appState.get('activeRecommendations') || [];

            if (recs.length === 0) {
                this.recommendationsList.innerHTML = `
                    <div class="empty-recommendation">
                        <i data-lucide="check-circle-2"></i>
                        <p>Crowd flow is currently optimal. No immediate actions required.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            this.recommendationsList.innerHTML = '';

            recs.forEach(rec => {
                const card = document.createElement('div');
                card.className = `recommendation-card ${rec.type === 'danger' ? 'danger' : 'warning'}`;
                card.innerHTML = `
                    <div class="rec-title">${this.escapeHtml(rec.title)}</div>
                    <div class="rec-desc">${this.escapeHtml(rec.desc)}</div>
                    <button class="rec-action-btn" data-rec-id="${rec.id}" aria-label="Execute recommendation: ${rec.title}">
                        <i data-lucide="shield-alert"></i> ${this.escapeHtml(rec.actionLabel)}
                    </button>
                `;
                this.recommendationsList.appendChild(card);

                // Add event listener
                const btn = card.querySelector('[data-rec-id]');
                btn.addEventListener('click', () => {
                    if (typeof rec.action === 'function') {
                        rec.action();
                    }
                });
            });

            lucide.createIcons();
        } catch (error) {
            console.error('Error rendering recommendations:', error);
        }
    }

    /**
     * Update system status indicator
     */
    updateSystemStatus(status = 'active') {
        try {
            if (!this.systemStatusEl) return;

            const statusMap = {
                'active': { text: 'System: Active & Scanning', class: 'safe' },
                'warning': { text: 'System: Alert Mode', class: 'warning' },
                'critical': { text: 'System: Critical Alert', class: 'danger' }
            };

            const config = statusMap[status] || statusMap['active'];
            this.systemStatusEl.className = `status-indicator ${config.class}`;
            this.systemStatusEl.querySelector('span:last-child').innerText = config.text;
        } catch (error) {
            console.error('Error updating system status:', error);
        }
    }

    /**
     * Update phone display alerts
     */
    updatePhoneAlert(title, description, type = 'info') {
        try {
            if (!this.phoneAlertCard) return;

            const iconMap = {
                'safe': 'info',
                'warning': 'alert-triangle',
                'danger': 'alert-octagon',
                'audio': 'volume-2'
            };

            this.phoneAlertCard.className = `phone-alert-card ${type}`;
            this.phoneAlertIcon.setAttribute('data-lucide', iconMap[type] || 'info');
            this.phoneAlertTitle.innerText = this.escapeHtml(title);
            this.phoneAlertDesc.innerText = this.escapeHtml(description);

            lucide.createIcons();
        } catch (error) {
            console.error('Error updating phone alert:', error);
        }
    }

    /**
     * Update audio player status
     */
    updateAudioStatus(isPlaying, text = '') {
        try {
            if (!this.audioPlayerStatus) return;

            if (isPlaying) {
                this.audioPlayerStatus.innerHTML = `<i data-lucide="volume-2" class="pulse-icon"></i> ${this.escapeHtml(text)}`;
            } else {
                this.audioPlayerStatus.innerHTML = `<i data-lucide="volume-x"></i> No broadcast currently active`;
            }
            lucide.createIcons();
        } catch (error) {
            console.error('Error updating audio status:', error);
        }
    }

    /**
     * Update clock display
     */
    updateClock() {
        try {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            if (this.timeDisplayEl) {
                const span = this.timeDisplayEl.querySelector('span');
                if (span) span.innerText = timeStr;
            }

            if (this.phoneTime) {
                this.phoneTime.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        } catch (error) {
            console.error('Error updating clock:', error);
        }
    }

    /**
     * Toggle heatmap visibility
     */
    toggleHeatmap(visible) {
        try {
            const btn = document.getElementById('btnToggleHeatmap');
            if (btn) {
                btn.classList.toggle('active', visible);
            }
            appState.set('showHeatmap', visible);
        } catch (error) {
            console.error('Error toggling heatmap:', error);
        }
    }

    /**
     * Toggle risk zones visibility
     */
    toggleRiskZones(visible) {
        try {
            const btn = document.getElementById('btnToggleRiskZones');
            if (btn) {
                btn.classList.toggle('active', visible);
            }
            appState.set('showRiskZones', visible);
        } catch (error) {
            console.error('Error toggling risk zones:', error);
        }
    }

    /**
     * Show notification toast
     */
    showNotification(message, type = 'info') {
        try {
            // Add visual notification (can be enhanced with toast library)
            console.log(`[${type.toUpperCase()}] ${message}`);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        try {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        } catch (error) {
            console.error('Error escaping HTML:', error);
            return String(text);
        }
    }
}

// Global UI Manager instance
const uiManager = new UIManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager, uiManager };
}
