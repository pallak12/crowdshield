/**
 * CROWDSHIELD STATE MANAGEMENT
 * Centralized state management with validation and change tracking
 * Provides a single source of truth for application state
 */

class StateManager {
    constructor() {
        this.state = {
            // Simulation State
            currentScenario: 'normal', // 'normal', 'surge', 'blockage', 'panic'
            particles: [],
            securityStaff: [],
            hazardMarkers: [],
            citizenActive: false,
            citizenNode: { x: 0, y: 0, targetX: 0, targetY: 0, speed: CONFIG.CITIZEN.SPEED },

            // UI State
            showHeatmap: true,
            showRiskZones: true,
            isSpeaking: false,

            // Metrics
            metrics: {
                crowdDensity: 1.2,
                avgSpeed: 1.4,
                stampedeLikelihood: 12,
                crushRiskLevel: 'LOW',
                panicIndex: 0.05,
                bottlenecks: 0,
                avgMovementSpeed: 1.4
            },

            // Interventions (Actions Taken)
            interventions: {
                gate3Open: true,
                gate1Closed: false,
                securityDeployed: false,
                crowdRedirected: false,
                evacuating: false
            },

            // Logs
            logs: [],

            // Active Recommendations
            activeRecommendations: [],

            // Timing
            lastUpdateTime: 0,
            frameCount: 0
        };

        this.listeners = {};
    }

    /**
     * Get a state value with validation
     */
    get(path) {
        try {
            const keys = path.split('.');
            let value = this.state;
            for (const key of keys) {
                if (value === null || value === undefined) return undefined;
                value = value[key];
            }
            return value;
        } catch (error) {
            console.error(`Error getting state.${path}:`, error);
            return undefined;
        }
    }

    /**
     * Set a state value with validation and change notification
     */
    set(path, value) {
        try {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let obj = this.state;

            // Navigate to parent object
            for (const key of keys) {
                if (!obj[key]) {
                    obj[key] = {};
                }
                obj = obj[key];
            }

            const oldValue = obj[lastKey];
            obj[lastKey] = value;

            // Notify listeners only if value changed
            if (oldValue !== value) {
                this.notifyListeners(path, value, oldValue);
            }

            return true;
        } catch (error) {
            console.error(`Error setting state.${path}:`, error);
            return false;
        }
    }

    /**
     * Update multiple state values at once
     */
    batchUpdate(updates) {
        try {
            for (const [path, value] of Object.entries(updates)) {
                this.set(path, value);
            }
            return true;
        } catch (error) {
            console.error('Error in batch update:', error);
            return false;
        }
    }

    /**
     * Register a listener for state changes
     */
    subscribe(path, callback) {
        if (!this.listeners[path]) {
            this.listeners[path] = [];
        }
        this.listeners[path].push(callback);

        // Return unsubscribe function
        return () => {
            this.listeners[path] = this.listeners[path].filter(cb => cb !== callback);
        };
    }

    /**
     * Notify all listeners of a state change
     */
    notifyListeners(path, newValue, oldValue) {
        if (this.listeners[path]) {
            this.listeners[path].forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in listener for ${path}:`, error);
                }
            });
        }
    }

    /**
     * Add a log entry
     */
    addLog(source, message, type = 'info') {
        try {
            const time = new Date();
            const entry = {
                timestamp: time,
                source,
                message,
                type // 'info', 'warning', 'danger', 'recommendation', 'system'
            };

            const logs = this.get('logs') || [];
            logs.push(entry);

            // Keep only last 100 logs
            if (logs.length > CONFIG.UI.LOG_MAX_ENTRIES) {
                logs.shift();
            }

            this.set('logs', [...logs]);

            if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
                const eventType = source && source.toLowerCase().includes('voice') ? 'voice_command' : 'system_event';
                backendClient.sendEventLog(eventType, type, message, source);
            }

            return true;
        } catch (error) {
            console.error('Error adding log:', error);
            return false;
        }
    }

    /**
     * Add a recommendation
     */
    addRecommendation(rec) {
        try {
            const recs = this.get('activeRecommendations') || [];
            const exists = recs.some(r => r.id === rec.id);

            if (!exists) {
                recs.push(rec);
                this.set('activeRecommendations', [...recs]);
            }
            return true;
        } catch (error) {
            console.error('Error adding recommendation:', error);
            return false;
        }
    }

    /**
     * Remove a recommendation
     */
    removeRecommendation(recId) {
        try {
            const recs = this.get('activeRecommendations') || [];
            const filtered = recs.filter(r => r.id !== recId);
            this.set('activeRecommendations', filtered);
            return true;
        } catch (error) {
            console.error('Error removing recommendation:', error);
            return false;
        }
    }

    /**
     * Clear all recommendations
     */
    clearRecommendations() {
        this.set('activeRecommendations', []);
    }

    /**
     * Set scenario with validation
     */
    setScenario(scenario) {
        const validScenarios = ['normal', 'surge', 'blockage', 'panic'];
        if (!validScenarios.includes(scenario)) {
            console.warn(`Invalid scenario: ${scenario}`);
            return false;
        }
        this.set('currentScenario', scenario);
        return true;
    }

    /**
     * Update intervention state
     */
    setIntervention(key, value) {
        const path = `interventions.${key}`;
        return this.set(path, Boolean(value));
    }

    /**
     * Update metrics
     */
    updateMetrics(metrics) {
        try {
            const currentMetrics = this.get('metrics');
            this.set('metrics', { ...currentMetrics, ...metrics });
            return true;
        } catch (error) {
            console.error('Error updating metrics:', error);
            return false;
        }
    }

    /**
     * Reset metrics to their neutral baseline values
     */
    resetMetrics() {
        this.state.metrics = {
            crowdDensity: 1.2,
            avgSpeed: 1.4,
            stampedeLikelihood: 12,
            crushRiskLevel: 'LOW',
            panicIndex: 0.05,
            bottlenecks: 0,
            avgMovementSpeed: 1.4
        };
        return true;
    }

    /**
     * Get current intervention state
     */
    getInterventions() {
        return this.get('interventions');
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.state.particles = [];
        this.state.securityStaff = [];
        this.state.hazardMarkers = [];
        this.state.citizenActive = false;
        this.state.logs = [];
        this.state.activeRecommendations = [];
        this.state.interventions = {
            gate3Open: true,
            gate1Closed: false,
            securityDeployed: false,
            crowdRedirected: false,
            evacuating: false
        };
        this.state.currentScenario = 'normal';
        this.resetMetrics();
    }

    /**
     * Export state for debugging
     */
    export() {
        return JSON.parse(JSON.stringify(this.state));
    }
}

// Global state instance
const appState = new StateManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StateManager, appState };
}
