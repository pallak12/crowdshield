/**
 * CROWDSHIELD CANVAS RENDERER
 * Handles all canvas drawing operations for the digital twin venue map
 */

class CanvasRenderer {
    constructor(canvasElement) {
        try {
            if (!canvasElement) {
                throw new Error('Canvas element not provided');
            }
            this.canvas = canvasElement;
            this.ctx = canvasElement.getContext('2d');
            if (!this.ctx) {
                throw new Error('Failed to get 2D context from canvas');
            }
            this.heatmapData = [];
        } catch (error) {
            console.error('Error initializing CanvasRenderer:', error);
        }
    }

    /**
     * Resize canvas to fit container
     */
    resize() {
        try {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            return { width: this.canvas.width, height: this.canvas.height };
        } catch (error) {
            console.error('Error resizing canvas:', error);
            return { width: 0, height: 0 };
        }
    }

    /**
     * Clear canvas
     * @private
     */
    clear() {
        try {
            this.ctx.fillStyle = CONFIG.COLORS.SAFE;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } catch (error) {
            console.error('Error clearing canvas:', error);
        }
    }

    /**
     * Draw background and venue layout
     */
    drawBackground() {
        try {
            // Background gradient
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            gradient.addColorStop(0, 'rgba(6, 9, 19, 0.8)');
            gradient.addColorStop(1, 'rgba(13, 20, 38, 0.9)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw border
            this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        } catch (error) {
            console.error('Error drawing background:', error);
        }
    }

    /**
     * Draw heatmap visualization
     */
    drawHeatmap() {
        try {
            if (!appState.get('showHeatmap')) return;

            const gridSize = CONFIG.CANVAS.HEATMAP_GRID_SIZE;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const colsCount = Math.ceil(w / gridSize);
            const rowCount = Math.ceil(h / gridSize);

            // Guard against invalid sizes
            if (!gridSize || colsCount <= 0 || rowCount <= 0) return;

            // Initialize or resize heatmap if needed
            if (this.heatmapData.length !== rowCount || (this.heatmapData[0] && this.heatmapData[0].length !== colsCount)) {
                this.heatmapData = Array(rowCount).fill(0).map(() => Array(colsCount).fill(0));
            }

            // Decay heatmap
            for (let r = 0; r < this.heatmapData.length; r++) {
                const rowArr = this.heatmapData[r] || [];
                for (let i = 0; i < rowArr.length; i++) {
                    rowArr[i] = (rowArr[i] || 0) * CONFIG.CANVAS.HEATMAP_DECAY_RATE;
                }
            }

            // Update heatmap based on particle positions
            const particles = appState.get('particles') || [];
            particles.forEach(p => {
                let col = Math.floor(p.x / gridSize);
                let row = Math.floor(p.y / gridSize);
                if (row >= 0 && row < rowCount && col >= 0 && col < colsCount) {
                    this.heatmapData[row][col] = (this.heatmapData[row][col] || 0) + 1;
                }
            });

            // Draw heatmap
            for (let row = 0; row < rowCount; row++) {
                const rowArr = this.heatmapData[row] || [];
                for (let col = 0; col < colsCount; col++) {
                    const value = rowArr[col] || 0;
                    if (value > 0) {
                        const hue = Math.max(0, 200 - (value * 20));
                        this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${Math.min(0.4, value * 0.1)})`;
                        this.ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
                    }
                }
            }
        } catch (error) {
            console.error('Error drawing heatmap:', error);
        }
    }

    /**
     * Draw risk zones
     */
    drawRiskZones() {
        try {
            if (!appState.get('showRiskZones')) return;

            const w = this.canvas.width;
            const h = this.canvas.height;
            const corridorX = CONFIG.CORRIDOR.X_CENTER;
            const corridorW = CONFIG.CORRIDOR.WIDTH;

            // Draw central bottleneck corridor
            const riskLevel = this.calculateRiskLevel();
            let color, alpha;

            if (riskLevel > CONFIG.RISK.DANGER_THRESHOLD) {
                color = CONFIG.COLORS.DANGER;
                alpha = 0.2;
            } else if (riskLevel > CONFIG.RISK.WARNING_THRESHOLD) {
                color = CONFIG.COLORS.WARNING;
                alpha = 0.15;
            } else {
                color = CONFIG.COLORS.SAFE;
                alpha = 0.05;
            }

            // Diagonal corridor
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = alpha;
            this.ctx.beginPath();
            this.ctx.moveTo(0, h / 2 - 60);
            this.ctx.lineTo(corridorX - corridorW / 2, h / 2 + 30);
            this.ctx.lineTo(corridorX + corridorW / 2, h / 2 + 30);
            this.ctx.lineTo(w, h / 2 - 60);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        } catch (error) {
            console.error('Error drawing risk zones:', error);
        }
    }

    /**
     * Draw all particles (crowd members)
     */
    drawParticles() {
        try {
            const particles = appState.get('particles') || [];

            particles.forEach(p => {
                // Get particle color based on state
                this.ctx.fillStyle = p.getColor();
                this.ctx.globalAlpha = p.state === 'panicking' ? 0.9 : 0.7;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw panic glow if panicking
                if (p.state === 'panicking') {
                    this.ctx.strokeStyle = CONFIG.COLORS.DANGER;
                    this.ctx.lineWidth = 1;
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.stroke();
                }
            });

            this.ctx.globalAlpha = 1.0;
        } catch (error) {
            console.error('Error drawing particles:', error);
        }
    }

    /**
     * Draw security units
     */
    drawSecurityUnits() {
        try {
            const securityStaff = appState.get('securityStaff') || [];

            securityStaff.forEach(guard => {
                // Draw security unit
                this.ctx.fillStyle = '#3b82f6';
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillRect(guard.x - 6, guard.y - 6, 12, 12);

                // Draw target indicator
                if (guard.targetX !== guard.x || guard.targetY !== guard.y) {
                    this.ctx.strokeStyle = '#06b6d4';
                    this.ctx.globalAlpha = 0.4;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(guard.x, guard.y);
                    this.ctx.lineTo(guard.targetX, guard.targetY);
                    this.ctx.stroke();
                }

                // Draw label
                this.ctx.fillStyle = '#f3f4f6';
                this.ctx.globalAlpha = 1.0;
                this.ctx.font = '10px Outfit';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(guard.label, guard.x, guard.y - 12);
            });

            this.ctx.globalAlpha = 1.0;
        } catch (error) {
            console.error('Error drawing security units:', error);
        }
    }

    /**
     * Draw venue landmarks
     */
    drawLandmarks() {
        try {
            const w = this.canvas.width;
            const h = this.canvas.height;

            // Draw Gate 1 (Entrance)
            this.ctx.fillStyle = '#06b6d4';
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillRect(20, 10, 60, 40);
            this.ctx.fillStyle = '#f3f4f6';
            this.ctx.font = 'bold 12px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillText('Gate 1', 50, 35);

            // Draw Shrine location
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(w / 2, h - 120, 15, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#f3f4f6';
            this.ctx.globalAlpha = 1.0;
            this.ctx.font = 'bold 11px Outfit';
            this.ctx.fillText('Shrine', w / 2, h - 115);

            // Draw Gate 3 (Exit)
            const interventions = appState.getInterventions();
            this.ctx.fillStyle = interventions.gate3Open ? '#10b981' : '#ef4444';
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillRect(w - 80, 160, 60, 40);
            this.ctx.fillStyle = '#f3f4f6';
            this.ctx.globalAlpha = 1.0;
            this.ctx.font = 'bold 12px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Gate 3', w - 50, 185);

            this.ctx.globalAlpha = 1.0;
        } catch (error) {
            console.error('Error drawing landmarks:', error);
        }
    }

    /**
     * Draw hazard markers
     */
    drawHazardMarkers() {
        try {
            const hazardMarkers = appState.get('hazardMarkers') || [];

            hazardMarkers.forEach(hz => {
                this.ctx.fillStyle = CONFIG.COLORS.DANGER;
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.arc(hz.x, hz.y, 10, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw warning rings
                this.ctx.strokeStyle = CONFIG.COLORS.DANGER;
                this.ctx.globalAlpha = 0.3;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(hz.x, hz.y, 20, 0, Math.PI * 2);
                this.ctx.stroke();
            });

            this.ctx.globalAlpha = 1.0;
        } catch (error) {
            console.error('Error drawing hazard markers:', error);
        }
    }

    /**
     * Draw citizen node (mobile companion simulation)
     */
    drawCitizenNode() {
        try {
            const citizen = appState.get('citizenNode');
            if (!citizen || !appState.get('citizenActive')) return;

            this.ctx.fillStyle = '#8b5cf6';
            this.ctx.globalAlpha = 0.9;
            this.ctx.beginPath();
            this.ctx.arc(citizen.x, citizen.y, 5, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw glow
            this.ctx.strokeStyle = '#8b5cf6';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.4;
            this.ctx.beginPath();
            this.ctx.arc(citizen.x, citizen.y, 12, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.globalAlpha = 1.0;
        } catch (error) {
            console.error('Error drawing citizen node:', error);
        }
    }

    /**
     * Calculate current risk level for zone coloring
     * @private
     */
    calculateRiskLevel() {
        try {
            const particles = appState.get('particles') || [];
            const metrics = appState.get('metrics');
            return Math.min(100, Math.max(0, 
                particles.length * 0.5 + 
                (metrics.panicIndex || 0) * 50
            ));
        } catch (error) {
            console.error('Error calculating risk level:', error);
            return 0;
        }
    }

    /**
     * Main render function
     */
    render() {
        try {
            this.drawBackground();
            this.drawHeatmap();
            this.drawRiskZones();
            this.drawParticles();
            this.drawSecurityUnits();
            this.drawHazardMarkers();
            this.drawCitizenNode();
            this.drawLandmarks();
        } catch (error) {
            console.error('Error in render cycle:', error);
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CanvasRenderer };
}
