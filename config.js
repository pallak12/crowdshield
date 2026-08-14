/**
 * CROWDSHIELD CONFIGURATION
 * Centralized configuration for all constants and settings
 * This eliminates magic numbers and makes the app easily configurable
 */

const CONFIG = {
    // Canvas & Rendering
    CANVAS: {
        TARGET_FPS: 60,
        WIDTH: 800,
        HEIGHT: 500,
        HEATMAP_GRID_SIZE: 20,
        HEATMAP_DECAY_RATE: 0.95
    },

    // Particle (Crowd) Simulation
    PARTICLE: {
        // Reduced default population and spawn rate for more realistic alerts
        COUNT: 80,
        RADIUS: 4,
        SPAWN_RATE: 1,
        BASE_SPEED: 1.0,
        SPEED_VARIANCE: 0.8,
        SPEED_PANIC: 2.5,
        SPEED_EVACUATION: 1.8,
        FRICTION: 0.85,
        ACCELERATION_FACTOR: 0.15,
        MIN_DISTANCE: 3,
        REPULSION_FORCE: 0.12,
        SHRINE_DWELL_MIN: 60,
        SHRINE_DWELL_VARIANCE: 120,
        PANIC_SPREAD_RADIUS: 30,
        PANIC_SPREAD_CHANCE: 0.15,
        PANIC_CALM_CHANCE: 0.005
    },

    // Crowd Metrics & Detection
    DENSITY: {
        GRID_SIZE: 50,
        NORMAL_THRESHOLD: 3,
        WARNING_THRESHOLD: 6,
        DANGER_THRESHOLD: 10,
        CRITICAL_THRESHOLD: 14
    },

    // Security Units
    SECURITY: {
        UNIT_COUNT: 4,
        SPEED: 2.0,
        SEPARATION_RADIUS: 30,
        REPULSION_FORCE: 0.18
    },

    // Bottleneck & Corridor
    CORRIDOR: {
        X_CENTER: null, // Will be calculated based on canvas width
        WIDTH: 100,
        LEFT_WALL_FORCE: 0.4,
        RIGHT_WALL_FORCE: 0.4
    },

    // Hazard Markers
    HAZARD: {
        AVOIDANCE_RADIUS: 45,
        REPULSION_FORCE: 0.25,
        DECAY_RATE: 0.98
    },

    // Risk Calculation
    RISK: {
        GAUGE_MAX: 100,
        CRUSH_RISK_WEIGHT: 0.4,
        DENSITY_WEIGHT: 0.25,
        PANIC_WEIGHT: 0.25,
        SAFE_THRESHOLD: 25,
        WARNING_THRESHOLD: 60,
        DANGER_THRESHOLD: 85
    },

    // UI Updates
    UI: {
        UPDATE_INTERVAL: 200,
        LOG_MAX_ENTRIES: 100,
        RECOMMENDATION_CHECK_INTERVAL: 1500,
        CLOCK_UPDATE_INTERVAL: 1000
    },

    // Venues & Locations
    VENUE: {
        NAME: "Festival Ground A",
        ENTRANCE_GATE_1: { x: 50, y: 30 },
        ENTRANCE_GATE_2: { x: 50, y: 200 },
        SHRINE_LOCATION: { x: null, y: null }, // Will be calculated
        EXIT_GATE_3: { x: null, y: 180 },
        EXIT_GATE_4_5: { x: null, y: null } // Will be calculated
    },

    // Citizen Simulation
    CITIZEN: {
        SPEED: 1.5,
        SPAWN_X: 50,
        SPAWN_Y: 30
    },

    // Speech Synthesis
    SPEECH: {
        RATE: 0.9,
        LANGUAGES: {
            en: 'en-US',
            hi: 'hi-IN',
            ta: 'ta-IN',
            bn: 'bn-IN'
        }
    },

    BACKEND: {
        BASE_URL: 'http://localhost:4000',
        API_TOKEN: 'localtesttoken123' // Must match the backend API_TOKEN in backend/.env
    },

    // Colors
    COLORS: {
        SAFE: '#10b981',
        WARNING: '#f59e0b',
        DANGER: '#ef4444',
        PARTICLE_NORMAL: '#3b82f6',
        PARTICLE_PANIC: '#ef4444',
        HEATMAP_GRADIENT: ['#0ea5e9', '#f59e0b', '#ef4444']
    },

    // Thresholds
    THRESHOLDS: {
        BOTTLENECK_CRITICAL_DENSITY: 6,
        PANIC_THRESHOLD: 0.6,
        EVACUATION_TRIGGER: 0.8
    }
};

/**
 * Initialize venue-dependent configuration
 * Should be called after canvas dimensions are known
 */
function initializeVenueConfig(canvasWidth, canvasHeight) {
    CONFIG.CORRIDOR.X_CENTER = canvasWidth / 2;
    CONFIG.VENUE.SHRINE_LOCATION.x = canvasWidth / 2;
    CONFIG.VENUE.SHRINE_LOCATION.y = canvasHeight - 120;
    CONFIG.VENUE.EXIT_GATE_3.x = canvasWidth - 40;
    CONFIG.VENUE.EXIT_GATE_4_5.x = canvasWidth / 2;
    CONFIG.VENUE.EXIT_GATE_4_5.y = canvasHeight - 30;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, initializeVenueConfig };
}
