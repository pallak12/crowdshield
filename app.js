/**
 * CROWDSHIELD MAIN APPLICATION
 * Entry point that initializes and manages the entire application
 * Refactored with modular architecture, error handling, and improved performance
 */

// Global references (populated after initialization)
let canvasRenderer = null;
let particleSystem = null;
let securityUnits = [];

// Animation loop control
let animationFrameId = null;
let lastFrameTime = 0;

/**
 * Initialize the entire application
 */
async function initializeApp() {
    try {
        console.log('🚀 Initializing CrowdShield...');

        // 1. Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // 2. Get canvas and setup rendering
        const canvas = document.getElementById('digitalTwinCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }

        canvasRenderer = new CanvasRenderer(canvas);
        const dims = canvasRenderer.resize();
        window.addEventListener('resize', () => {
            const newDims = canvasRenderer.resize();
            initializeVenueConfig(newDims.width, newDims.height);
        });

        // 3. Initialize venue configuration
        initializeVenueConfig(dims.width, dims.height);

        // 4. Create particle system
        particleSystem = new ParticleSystem(dims.width, dims.height);
        window.particleSystem = particleSystem; // Make globally accessible

        // 5. Initialize security units
        initializeSecurityUnits(dims.width, dims.height);

        // 6. Setup event listeners
        eventManager.init();

        // 7. Start update loops
        startUpdateLoops();

        // 8. Load backend recommendations when available
        await loadBackendRecommendations();

        // 9. Start animation loop
        startAnimationLoop();

        // 9. Initial scenario
        appState.setScenario('normal');

        console.log('✅ CrowdShield initialized successfully');
        appState.addLog('System', 'CrowdShield AI System Online', 'info');
    } catch (error) {
        console.error('❌ Fatal error during initialization:', error);
        displayErrorMessage(error.message);
    }
}

/**
 * Initialize security units
 */
function initializeSecurityUnits(canvasWidth, canvasHeight) {
    try {
        securityUnits = [
            {
                x: canvasWidth * 0.1,
                y: canvasHeight * 0.3,
                targetX: canvasWidth * 0.1,
                targetY: canvasHeight * 0.3,
                label: 'S-1',
                speed: CONFIG.SECURITY.SPEED
            },
            {
                x: canvasWidth * 0.15,
                y: canvasHeight * 0.36,
                targetX: canvasWidth * 0.15,
                targetY: canvasHeight * 0.36,
                label: 'S-2',
                speed: CONFIG.SECURITY.SPEED
            },
            {
                x: canvasWidth * 0.52,
                y: canvasHeight * 0.44,
                targetX: canvasWidth * 0.52,
                targetY: canvasHeight * 0.44,
                label: 'S-3',
                speed: CONFIG.SECURITY.SPEED
            },
            {
                x: canvasWidth * 0.32,
                y: canvasHeight * 0.72,
                targetX: canvasWidth * 0.32,
                targetY: canvasHeight * 0.72,
                label: 'S-4',
                speed: CONFIG.SECURITY.SPEED
            }
        ];

        appState.set('securityStaff', securityUnits);
    } catch (error) {
        console.error('Error initializing security units:', error);
    }
}

/**
 * Start continuous update loops
 */
function startUpdateLoops() {
    try {
        // Clock update loop
        setInterval(() => {
            try {
                uiManager.updateClock();
            } catch (error) {
                console.error('Error in clock update:', error);
            }
        }, CONFIG.UI.CLOCK_UPDATE_INTERVAL);

        // Metrics calculation loop
        setInterval(() => {
            try {
                updateMetrics();
            } catch (error) {
                console.error('Error in metrics update:', error);
            }
        }, CONFIG.UI.UPDATE_INTERVAL);

        // AI recommendations loop
        setInterval(() => {
            try {
                calculateAIRecommendations();
            } catch (error) {
                console.error('Error in AI recommendations:', error);
            }
        }, CONFIG.UI.RECOMMENDATION_CHECK_INTERVAL);

        // Security unit movement loop
        setInterval(() => {
            try {
                updateSecurityUnits();
            } catch (error) {
                console.error('Error updating security units:', error);
            }
        }, 30);

        // Citizen movement loop
        setInterval(() => {
            try {
                updateCitizenNode();
            } catch (error) {
                console.error('Error updating citizen node:', error);
            }
        }, 40);

        // Hazard marker decay loop
        setInterval(() => {
            try {
                decayHazardMarkers();
            } catch (error) {
                console.error('Error decaying hazard markers:', error);
            }
        }, 500);
    } catch (error) {
        console.error('Error starting update loops:', error);
    }
}

/**
 * Start animation loop using requestAnimationFrame
 */
function startAnimationLoop() {
    try {
        function animate(currentTime) {
            try {
                const deltaTime = currentTime - lastFrameTime;
                lastFrameTime = currentTime;

                // Update particle system
                if (particleSystem) {
                    particleSystem.updateAll();
                }

                // Render
                if (canvasRenderer) {
                    canvasRenderer.render();
                }

                animationFrameId = requestAnimationFrame(animate);
            } catch (error) {
                console.error('Error in animation frame:', error);
                animationFrameId = requestAnimationFrame(animate);
            }
        }

        animationFrameId = requestAnimationFrame(animate);
    } catch (error) {
        console.error('Error starting animation loop:', error);
    }
}
 
/**
 * Load recommendations from the secure backend if available
 */
async function loadBackendRecommendations() {
    try {
        if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
            const recommendations = await backendClient.fetchRecommendations();
            if (Array.isArray(recommendations) && recommendations.length > 0) {
                const mappedRecs = recommendations.map((rec, index) => ({
                    id: rec.id || `backend-rec-${index}`,
                    type: rec.type || 'warning',
                    title: rec.title || 'Recommended action from backend',
                    desc: rec.description || rec.desc || '',
                    actionLabel: 'Execute Recommended Action',
                    action: () => {
                        if (typeof rec.action === 'string') {
                            runVoiceCommand(rec.action);
                        } else {
                            console.log('Backend recommendation selected:', rec);
                        }
                    }
                }));
                appState.set('activeRecommendations', mappedRecs);
                appState.addLog('Backend', 'Loaded recommendations from secure backend', 'info');
            }
        }
    } catch (error) {
        console.warn('Unable to load backend recommendations:', error);
    }
}
 
/**
 * Calculate peak local crowd density (max count in a 50x50 grid cell)
 * @private
 */
function calculatePeakLocalDensity() {
    try {
        const particles = appState.get('particles') || [];
        if (particles.length === 0) return 0;

        const gridSize = CONFIG.DENSITY.GRID_SIZE || 50;
        const grid = {};

        particles.forEach(p => {
            // Exclude particles close to entrance gates (spawning zone x < 120)
            // to avoid artificial spawning density from inflating risk ratings.
            if (p.x < 120) return;

            const cx = Math.floor(p.x / gridSize);
            const cy = Math.floor(p.y / gridSize);
            const key = `${cx},${cy}`;
            grid[key] = (grid[key] || 0) + 1;
        });

        // Instead of returning the single maximum cell (which is noisy), compute the 90th percentile
        // of cell occupancies so alerts reflect broader crowding, not a single spike.
        const counts = Object.values(grid);
        if (counts.length === 0) return 0;
        counts.sort((a,b) => a - b);
        const idx = Math.max(0, Math.floor(0.9 * counts.length) - 1);
        const percentile90 = counts[idx] || counts[counts.length - 1];
        return percentile90;
    } catch (error) {
        console.error('Error calculating peak local density:', error);
        return 0;
    }
}

/**
 * Update all metrics based on current state
 */
function updateMetrics() {
    try {
        const particles = appState.get('particles') || [];
        const scenario = appState.get('currentScenario');

        // Calculate peak local crowd density
        const crowdDensity = calculatePeakLocalDensity();

        // Calculate average movement speed
        let totalSpeed = 0;
        particles.forEach(p => {
            const speed = Math.hypot(p.vx, p.vy);
            totalSpeed += speed;
        });
        const avgSpeed = particles.length > 0 ? totalSpeed / particles.length : 0;

        // Calculate panic index
        const panicCount = particles.filter(p => p.state === 'panicking').length;
        const panicIndex = particles.length > 0 ? panicCount / particles.length : 0;

        // Calculate stampede likelihood (0-100)
        let likelihood = 0;
        const crushRisk = calculateCrushRisk(crowdDensity);
        
        likelihood = 
            (crushRisk * CONFIG.RISK.CRUSH_RISK_WEIGHT) +
            (Math.min(crowdDensity * 10, 100) * CONFIG.RISK.DENSITY_WEIGHT) +
            (panicIndex * 100 * CONFIG.RISK.PANIC_WEIGHT);

        likelihood = Math.round(Math.min(likelihood, 100));

        // Determine crush risk level based on local density thresholds
        let crushRiskLevel = 'LOW';
        if (crowdDensity >= CONFIG.DENSITY.CRITICAL_THRESHOLD) {
            crushRiskLevel = 'CRITICAL';
        } else if (crowdDensity >= CONFIG.DENSITY.DANGER_THRESHOLD) {
            crushRiskLevel = 'HIGH';
        } else if (crowdDensity >= CONFIG.DENSITY.WARNING_THRESHOLD) {
            crushRiskLevel = 'MEDIUM';
        }

        // Detect bottlenecks
        let bottlenecks = detectBottlenecks();

        // Update metrics in state
        appState.updateMetrics({
            crowdDensity: crowdDensity.toFixed(2),
            avgMovementSpeed: avgSpeed.toFixed(2),
            stampedeLikelihood: likelihood,
            crushRiskLevel,
            panicIndex: panicIndex.toFixed(2),
            bottlenecks
        });

        // Update system status based on risk
        updateSystemStatus(likelihood);
    } catch (error) {
        console.error('Error updating metrics:', error);
    }
}

/**
 * Calculate crush risk based on density
 * @private
 */
function calculateCrushRisk(density) {
    try {
        // Scale crush risk proportionally to the configured CRITICAL_THRESHOLD instead of
        // jumping between fixed buckets. This produces more graded alerting that follows
        // the observed simulation values.
        const crit = Number(CONFIG.DENSITY.CRITICAL_THRESHOLD) || 10;
        if (density <= 0) return 0;
        const scaled = Math.round((density / crit) * 100);
        return Math.max(0, Math.min(100, scaled));
    } catch (e) {
        console.error('Error in calculateCrushRisk:', e);
        // fall back to previous behavior
        if (density >= CONFIG.DENSITY.CRITICAL_THRESHOLD) return 100;
        if (density >= CONFIG.DENSITY.DANGER_THRESHOLD) return 75;
        if (density >= CONFIG.DENSITY.WARNING_THRESHOLD) return 50;
        if (density >= CONFIG.DENSITY.NORMAL_THRESHOLD) return 25;
        return 0;
    }
}

/**
 * Detect bottlenecks in the central corridor
 * @private
 */
function detectBottlenecks() {
    try {
        const particles = appState.get('particles') || [];
        const canvas = document.getElementById('digitalTwinCanvas');
        if (!canvas) return 0;

        const corridorX = CONFIG.CORRIDOR.X_CENTER;
        const corridorW = CONFIG.CORRIDOR.WIDTH;
        const bottleneckRadius = 60;

        let bottleneckCount = 0;
        let particlesInCorridor = 0;

        particles.forEach(p => {
            const distFromCenter = Math.abs(p.x - corridorX);
            if (distFromCenter < corridorW) {
                particlesInCorridor++;
            }
        });

        // Consider it a bottleneck if significant crowd in narrow area
        if (particlesInCorridor > CONFIG.THRESHOLDS.BOTTLENECK_CRITICAL_DENSITY) {
            bottleneckCount = 1;
        }

        return bottleneckCount;
    } catch (error) {
        console.error('Error detecting bottlenecks:', error);
        return 0;
    }
}

/**
 * Update system status indicator
 * @private
 */
function updateSystemStatus(likelihood) {
    try {
        // Decide system status with scenario-aware rules and minimum crowd guard
        const scenario = appState.get('currentScenario');
        const particles = appState.get('particles') || [];
        const count = particles.length || 0;

            // Use metrics when deciding whether to suppress alerts for tiny crowds
        const metrics = appState.get('metrics') || {};
        const panicIndex = Number(metrics.panicIndex) || 0;
        const reportedLikelihood = Number(metrics.stampedeLikelihood) || likelihood || 0;

        // If there is essentially no crowd and metrics don't indicate risk, suppress alerts
        if (count <= 5 && panicIndex < CONFIG.THRESHOLDS.PANIC_THRESHOLD && reportedLikelihood < CONFIG.RISK.WARNING_THRESHOLD) {
            uiManager.updateSystemStatus('active');
            uiManager.updatePhoneAlert('No Congestion Alerts', 'The crowd is moving smoothly.', 'safe');
            return;
        }

        // Compute effective thresholds based on scenario bias
        let danger = Number(CONFIG.RISK.DANGER_THRESHOLD);
        let warning = Number(CONFIG.RISK.WARNING_THRESHOLD);
        const bias = CONFIG.RISK.SCENARIO_BIAS || {};

        if (scenario === 'surge') {
            warning = Math.max(0, warning - (bias.surge?.warningDelta || 15));
            danger = Math.max(warning + 1, danger - (bias.surge?.dangerDelta || 10));
        } else if (scenario === 'blockage') {
            warning = Math.max(0, warning - (bias.blockage?.warningDelta || 8));
            danger = Math.max(warning + 1, danger - (bias.blockage?.dangerDelta || 5));
        }

        // Scenario-aware mapping, but still driven by metrics (recommended behavior)
        let status = 'active';

        if (scenario === 'panic') {
            // For panic, require either a measurable panicIndex or high likelihood before forcing critical
            const panicTrigger = bias.panic?.panicIndexTrigger || CONFIG.THRESHOLDS.PANIC_THRESHOLD;
            if (panicIndex >= panicTrigger || reportedLikelihood >= warning) {
                status = 'critical';
            } else if (reportedLikelihood > warning) {
                status = 'warning';
            } else {
                status = 'active';
            }
        } else {
            // Metric-driven with effective thresholds
            if (reportedLikelihood > danger) status = 'critical';
            else if (reportedLikelihood > warning) status = 'warning';
            else status = 'active';
        }

        uiManager.updateSystemStatus(status);

        // Update phone alert message succinctly according to final status
        if (status === 'active') {
            uiManager.updatePhoneAlert('No Congestion Alerts', 'The crowd is moving smoothly.', 'safe');
        } else if (status === 'warning') {
            uiManager.updatePhoneAlert('Elevated Crowd Levels', 'Please monitor flow and consider deploying staff.', 'warning');
        } else if (status === 'critical') {
            uiManager.updatePhoneAlert('Critical Crowd Risk', 'Immediate action required: deploy interventions and follow emergency procedures.', 'danger');
        }
    } catch (error) {
        console.error('Error updating system status:', error);
    }
}

/**
 * Calculate AI recommendations based on current metrics
 */
function calculateAIRecommendations() {
    try {
        const recommendations = [];
        const metrics = appState.get('metrics');
        const interventions = appState.getInterventions();
        const scenario = appState.get('currentScenario');

        // Check for high stampede risk
        if (metrics.stampedeLikelihood > CONFIG.RISK.WARNING_THRESHOLD && 
            !interventions.securityDeployed) {
            recommendations.push({
                id: 'deploy_security',
                type: 'warning',
                title: '⚠️ Crowd Concentration Detected',
                desc: 'High crowd density in central corridor. Deploy security personnel to manage flow.',
                actionLabel: 'Deploy Security Personnel',
                action: () => {
                    runVoiceCommand('deploy security units');
                }
            });
        }

        // Check for gate blockage scenario
        if (scenario === 'blockage' && !interventions.gate1Closed) {
            recommendations.push({
                id: 'close_gate',
                type: 'warning',
                title: '🚪 Traffic Control Needed',
                desc: 'Gate 3 is blocked. Close Gate 1 to prevent further crowd buildup.',
                actionLabel: 'Close Gate 1 Entrance',
                action: () => {
                    runVoiceCommand('close gate 1');
                }
            });
        }

        // Check for panic scenario
        if (scenario === 'panic' && !interventions.evacuating) {
            recommendations.push({
                id: 'trigger_evac',
                type: 'danger',
                title: '🚨 Panic Outbreak Detected',
                desc: 'Panic spreading detected. Broadcast calming announcements and trigger evacuation.',
                actionLabel: 'Trigger Broadcast & Evacuation',
                action: () => {
                    runVoiceCommand('trigger evacuation');
                }
            });
        }

        // Check for surge scenario
        if (scenario === 'surge' && metrics.stampedeLikelihood > 50) {
            recommendations.push({
                id: 'redirect_crowd',
                type: 'warning',
                title: '🔀 Flow Optimization',
                desc: 'Open Gate 3 and redirect crowd to distribute flow more evenly.',
                actionLabel: 'Redirect Crowd Flow',
                action: () => {
                    runVoiceCommand('redirect crowd');
                }
            });
        }

        // Preserve backend recommendations if present and merge with local recommendations
        const remoteRecommendations = (appState.get('activeRecommendations') || []).filter(rec => typeof rec.id === 'string' && rec.id.startsWith('backend-rec-'));
        const merged = [...recommendations];
        if (remoteRecommendations.length) {
            merged.push(...remoteRecommendations);
        }

        appState.set('activeRecommendations', merged);
    } catch (error) {
        console.error('Error calculating AI recommendations:', error);
    }
}

/**
 * Update security unit positions
 */
function updateSecurityUnits() {
    try {
        const securityStaff = appState.get('securityStaff') || [];

        securityStaff.forEach(guard => {
            const dx = guard.targetX - guard.x;
            const dy = guard.targetY - guard.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 2) {
                const speed = guard.speed || CONFIG.SECURITY.SPEED;
                guard.x += (dx / dist) * speed;
                guard.y += (dy / dist) * speed;
            }
        });

        appState.set('securityStaff', securityStaff);
    } catch (error) {
        console.error('Error updating security units:', error);
    }
}

/**
 * Update citizen node position
 */
function updateCitizenNode() {
    try {
        const isActive = appState.get('citizenActive');
        if (!isActive) return;

        const citizen = appState.get('citizenNode');
        if (!citizen) return;

        const canvas = document.getElementById('digitalTwinCanvas');
        if (!canvas) return;

        const dx = citizen.targetX - citizen.x;
        const dy = citizen.targetY - citizen.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 5) {
            // Pick new random target
            citizen.targetX = Math.random() * (canvas.width - 100) + 50;
            citizen.targetY = Math.random() * (canvas.height - 100) + 50;
        } else {
            const speed = citizen.speed || CONFIG.CITIZEN.SPEED;
            citizen.x += (dx / dist) * speed;
            citizen.y += (dy / dist) * speed;
        }

        appState.set('citizenNode', citizen);
    } catch (error) {
        console.error('Error updating citizen node:', error);
    }
}

/**
 * Decay hazard markers over time
 */
function decayHazardMarkers() {
    try {
        const hazards = appState.get('hazardMarkers') || [];
        const remaining = hazards.filter(hz => {
            hz.intensity = (hz.intensity || 1) * CONFIG.HAZARD.DECAY_RATE;
            return hz.intensity > 0.1;
        });
        appState.set('hazardMarkers', remaining);
    } catch (error) {
        console.error('Error decaying hazard markers:', error);
    }
}

/**
 * Display error message to user
 * @private
 */
function displayErrorMessage(message) {
    try {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 16px;
            border-radius: 8px;
            z-index: 9999;
            font-family: Outfit, sans-serif;
        `;
        errorDiv.innerText = `Error: ${message}`;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    } catch (error) {
        console.error('Error displaying error message:', error);
    }
}

/**
 * Cleanup and shutdown application
 */
function shutdownApp() {
    try {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        eventManager.cleanup();
        console.log('CrowdShield shutdown complete');
    } catch (error) {
        console.error('Error during shutdown:', error);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', shutdownApp);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        shutdownApp,
        updateMetrics,
        calculateAIRecommendations
    };
}
