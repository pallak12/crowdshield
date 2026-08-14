/**
 * CROWDSHIELD PARTICLE SYSTEM
 * Physically-based crowd simulation using particle physics and social forces
 * Handles movement, collision, and behavioral states
 */

/**
 * Represents a single crowd member (particle)
 */
class CrowdParticle {
    /**
     * Initialize a crowd particle
     * @param {number} startX - Initial X position
     * @param {number} startY - Initial Y position
     * @param {string} targetType - 'shrine' or 'exit'
     */
    constructor(startX, startY, targetType = 'shrine') {
        try {
            this.x = startX;
            this.y = startY;
            this.vx = 0;
            this.vy = 0;
            this.radius = CONFIG.PARTICLE.RADIUS;
            this.speed = CONFIG.PARTICLE.BASE_SPEED + Math.random() * CONFIG.PARTICLE.SPEED_VARIANCE;
            this.targetType = targetType;
            this.shrineDwellTime = CONFIG.PARTICLE.SHRINE_DWELL_MIN + Math.random() * CONFIG.PARTICLE.SHRINE_DWELL_VARIANCE;
            this.state = 'normal'; // 'normal', 'panicking', 'exiting'
            this.color = CONFIG.COLORS.PARTICLE_NORMAL;
            this.panicDuration = 0;
        } catch (error) {
            console.error('Error initializing CrowdParticle:', error);
        }
    }

    /**
     * Update particle position and velocity
     */
    update(canvasW, canvasH) {
        try {
            // Determine target location based on state
            let targetX = CONFIG.VENUE.SHRINE_LOCATION.x;
            let targetY = CONFIG.VENUE.SHRINE_LOCATION.y;
            const interventions = appState.getInterventions();

            if (this.state === 'exiting') {
                if (interventions.crowdRedirected) {
                    targetX = (this.x < canvasW / 2) ? 60 : canvasW - 60;
                    targetY = CONFIG.VENUE.EXIT_GATE_4_5.y;
                } else if (interventions.gate3Open) {
                    targetX = CONFIG.VENUE.EXIT_GATE_3.x;
                    targetY = CONFIG.VENUE.EXIT_GATE_3.y;
                } else {
                    targetX = (this.x < canvasW / 2) ? 100 : canvasW - 100;
                    targetY = canvasH - 30;
                }
            }

            // Calculate base attractive force
            let dx = targetX - this.x;
            let dy = targetY - this.y;
            let dist = Math.hypot(dx, dy);

            let ax = 0;
            let ay = 0;

            // Apply attractive force toward target
            if (dist > 5) {
                ax = (dx / dist) * this.speed * CONFIG.PARTICLE.ACCELERATION_FACTOR;
                ay = (dy / dist) * this.speed * CONFIG.PARTICLE.ACCELERATION_FACTOR;
            }

            // Dwell at shrine
            if (this.state === 'normal' && dist < 30) {
                this.shrineDwellTime--;
                if (this.shrineDwellTime <= 0) {
                    this.state = 'exiting';
                }
                ax = (Math.random() - 0.5) * 0.05;
                ay = (Math.random() - 0.5) * 0.05;
            }

            // Apply repulsive forces from other particles
            this.applyParticleRepulsion(ax, ay);

            // Apply repulsive forces from security
            this.applySecurityRepulsion(ax, ay);

            // Apply wall forces
            this.applyWallForces(canvasW, canvasH, ax, ay);

            // Apply hazard avoidance
            this.applyHazardAvoidance(ax, ay);

            // Apply panic behavior
            if (this.state === 'panicking') {
                this.applyPanicBehavior(ax, ay);
            }

            // Handle evacuation override
            if (interventions.evacuating) {
                this.state = 'exiting';
                this.speed = CONFIG.PARTICLE.SPEED_EVACUATION;
            }

            // Update velocity with forces
            const currSpeed = Math.hypot(this.vx + ax, this.vy + ay);
            if (currSpeed > this.speed) {
                const ratio = this.speed / currSpeed;
                this.vx = (this.vx + ax) * ratio;
                this.vy = (this.vy + ay) * ratio;
            } else {
                this.vx += ax;
                this.vy += ay;
            }

            // Apply friction
            this.vx *= CONFIG.PARTICLE.FRICTION;
            this.vy *= CONFIG.PARTICLE.FRICTION;

            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Boundary checking
            this.enforceCanvasBounds(canvasW, canvasH);
        } catch (error) {
            console.error('Error updating particle:', error);
        }
    }

    /**
     * Apply repulsive forces from other particles
     * @private
     */
    applyParticleRepulsion(ax, ay) {
        try {
            const particles = appState.get('particles') || [];
            particles.forEach(other => {
                if (other === this) return;

                let opx = other.x - this.x;
                let opy = other.y - this.y;
                let odist = Math.hypot(opx, opy);
                let minDist = this.radius + other.radius + CONFIG.PARTICLE.MIN_DISTANCE;

                if (odist < minDist && odist > 0.1) {
                    // Repulsive force
                    let force = (minDist - odist) * CONFIG.PARTICLE.REPULSION_FORCE;
                    ax -= (opx / odist) * force;
                    ay -= (opy / odist) * force;

                    // Panic contagion
                    if (this.state === 'panicking' && other.state === 'normal' && 
                        odist < CONFIG.PARTICLE.PANIC_SPREAD_RADIUS) {
                        if (Math.random() < CONFIG.PARTICLE.PANIC_SPREAD_CHANCE) {
                            other.state = 'panicking';
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error in particle repulsion:', error);
        }
    }

    /**
     * Apply repulsive forces from security staff
     * @private
     */
    applySecurityRepulsion(ax, ay) {
        try {
            const securityStaff = appState.get('securityStaff') || [];
            securityStaff.forEach(guard => {
                let gdx = guard.x - this.x;
                let gdy = guard.y - this.y;
                let gdist = Math.hypot(gdx, gdy);
                let activeRadius = CONFIG.SECURITY.SEPARATION_RADIUS;

                if (gdist < activeRadius && gdist > 0.1) {
                    let force = (activeRadius - gdist) * CONFIG.SECURITY.REPULSION_FORCE;
                    ax -= (gdx / gdist) * force;
                    ay -= (gdy / gdist) * force;
                }
            });
        } catch (error) {
            console.error('Error in security repulsion:', error);
        }
    }

    /**
     * Apply forces from corridor walls
     * @private
     */
    applyWallForces(canvasW, canvasH, ax, ay) {
        try {
            const corridorX = CONFIG.CORRIDOR.X_CENTER;
            const corridorW = CONFIG.CORRIDOR.WIDTH;

            let wallLeftY1 = canvasH / 2 - 60;
            let wallLeftY2 = canvasH / 2 + 30;
            let wallLeftX1 = 0;
            let wallLeftX2 = corridorX - corridorW / 2;

            let wallRightY1 = canvasH / 2 - 60;
            let wallRightY2 = canvasH / 2 + 30;
            let wallRightX1 = canvasW;
            let wallRightX2 = corridorX + corridorW / 2;

            // Left wall
            if (this.y > wallLeftY1 && this.y < wallLeftY2) {
                let pct = (this.y - wallLeftY1) / (wallLeftY2 - wallLeftY1);
                let wallX = wallLeftX1 + pct * (wallLeftX2 - wallLeftX1);
                if (this.x < wallX + 8) {
                    ax += CONFIG.CORRIDOR.LEFT_WALL_FORCE;
                    this.vx = Math.abs(this.vx) * 0.2;
                }
            }

            // Right wall
            if (this.y > wallRightY1 && this.y < wallRightY2) {
                let pct = (this.y - wallRightY1) / (wallRightY2 - wallRightY1);
                let wallX = wallRightX1 - pct * (wallRightX1 - wallRightX2);
                if (this.x > wallX - 8) {
                    ax -= CONFIG.CORRIDOR.RIGHT_WALL_FORCE;
                    this.vx = -Math.abs(this.vx) * 0.2;
                }
            }
        } catch (error) {
            console.error('Error in wall forces:', error);
        }
    }

    /**
     * Apply hazard marker avoidance
     * @private
     */
    applyHazardAvoidance(ax, ay) {
        try {
            const hazardMarkers = appState.get('hazardMarkers') || [];
            hazardMarkers.forEach(hz => {
                let hdx = hz.x - this.x;
                let hdy = hz.y - this.y;
                let hdist = Math.hypot(hdx, hdy);

                if (hdist < CONFIG.HAZARD.AVOIDANCE_RADIUS && hdist > 0.1) {
                    let force = (CONFIG.HAZARD.AVOIDANCE_RADIUS - hdist) * CONFIG.HAZARD.REPULSION_FORCE;
                    ax -= (hdx / hdist) * force;
                    ay -= (hdy / hdist) * force;
                }
            });
        } catch (error) {
            console.error('Error in hazard avoidance:', error);
        }
    }

    /**
     * Apply panic-induced erratic behavior
     * @private
     */
    applyPanicBehavior(ax, ay) {
        try {
            this.speed = CONFIG.PARTICLE.SPEED_PANIC;
            ax += (Math.random() - 0.5) * 0.5;
            ay += (Math.random() - 0.5) * 0.5;
            this.panicDuration++;

            // Gradually calm down when evacuating
            if (appState.getInterventions().evacuating && 
                Math.random() < CONFIG.PARTICLE.PANIC_CALM_CHANCE) {
                this.state = 'exiting';
            }
        } catch (error) {
            console.error('Error in panic behavior:', error);
        }
    }

    /**
     * Enforce canvas boundary constraints
     * @private
     */
    enforceCanvasBounds(canvasW, canvasH) {
        try {
            if (this.x < 10) { this.x = 10; this.vx = 0; }
            if (this.x > canvasW - 10) { this.x = canvasW - 10; this.vx = 0; }
            if (this.y < 10) { this.y = 10; this.vy = 0; }
            if (this.y > canvasH - 10) { this.y = canvasH - 10; this.vy = 0; }
        } catch (error) {
            console.error('Error enforcing canvas bounds:', error);
        }
    }

    /**
     * Get particle color based on state
     */
    getColor() {
        switch (this.state) {
            case 'panicking':
                return CONFIG.COLORS.PARTICLE_PANIC;
            default:
                return CONFIG.COLORS.PARTICLE_NORMAL;
        }
    }
}

/**
 * Particle System Manager
 */
class ParticleSystem {
    constructor(canvasWidth, canvasHeight) {
        try {
            this.canvasWidth = canvasWidth;
            this.canvasHeight = canvasHeight;
            this.spawnGate = 'gate1'; // Current spawn gate
            this.particleCounter = 0;
        } catch (error) {
            console.error('Error initializing ParticleSystem:', error);
        }
    }

    /**
     * Spawn new particles from gate
     */
    spawn(count) {
        try {
            const particles = appState.get('particles') || [];
            const scenario = appState.get('currentScenario');

            for (let i = 0; i < count; i++) {
                let spawnX, spawnY;

                if (scenario === 'surge') {
                    spawnX = CONFIG.VENUE.ENTRANCE_GATE_1.x + Math.random() * 20;
                    spawnY = CONFIG.VENUE.ENTRANCE_GATE_1.y + Math.random() * 20;
                } else {
                    spawnX = CONFIG.VENUE.ENTRANCE_GATE_1.x + Math.random() * 15;
                    spawnY = CONFIG.VENUE.ENTRANCE_GATE_1.y + Math.random() * 15;
                }

                particles.push(new CrowdParticle(spawnX, spawnY, 'shrine'));
            }

            appState.set('particles', particles);
        } catch (error) {
            console.error('Error spawning particles:', error);
        }
    }

    /**
     * Update all particles
     */
    updateAll() {
        try {
            const particles = appState.get('particles') || [];
            const scenario = appState.get('currentScenario');

            // Spawn new particles based on scenario (steady-state flow)
            const maxParticles = scenario === 'surge' ? CONFIG.PARTICLE.COUNT * 1.5 : CONFIG.PARTICLE.COUNT;
            const spawnRate = scenario === 'surge' ? CONFIG.PARTICLE.SPAWN_RATE * 2 : CONFIG.PARTICLE.SPAWN_RATE;
            if (particles.length < maxParticles) {
                this.spawn(Math.min(spawnRate, maxParticles - particles.length));
            }

            // Update existing particles
            particles.forEach(particle => {
                particle.update(this.canvasWidth, this.canvasHeight);
            });

            // Remove exited particles (cleanup)
            const remaining = particles.filter(p => {
                if (p.state === 'exiting') {
                    let tx = p.x < this.canvasWidth / 2 ? 60 : this.canvasWidth - 60;
                    let ty = this.canvasHeight - 30;
                    let dist = Math.hypot(p.x - tx, p.y - ty);
                    return dist > 15;
                }
                return true;
            });

            appState.set('particles', remaining);
        } catch (error) {
            console.error('Error updating particles:', error);
        }
    }

    /**
     * Reset particle system
     */
    reset() {
        try {
            appState.set('particles', []);
            this.particleCounter = 0;
        } catch (error) {
            console.error('Error resetting particle system:', error);
        }
    }

    /**
     * Induce panic in particles near a location
     */
    inducePanic(x, y, radius) {
        try {
            const particles = appState.get('particles') || [];
            let panicCount = 0;

            particles.forEach(p => {
                let dist = Math.hypot(p.x - x, p.y - y);
                if (dist < radius && p.state !== 'panicking' && panicCount < 10) {
                    p.state = 'panicking';
                    panicCount++;
                }
            });

            return panicCount;
        } catch (error) {
            console.error('Error inducing panic:', error);
            return 0;
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CrowdParticle, ParticleSystem };
}
