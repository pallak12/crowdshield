/**
 * CROWDSHIELD VOICE COMMANDS
 * Handles natural language command parsing and execution
 * Provides voice command processing with extensive error handling
 */

class VoiceCommandProcessor {
    constructor() {
        try {
            this.commandPatterns = this.initializeCommandPatterns();
            this.isProcessing = false;
        } catch (error) {
            console.error('Error initializing VoiceCommandProcessor:', error);
        }
    }

    /**
     * Initialize command pattern mappings
     * @private
     */
    initializeCommandPatterns() {
        return {
            openGate3: {
                patterns: ['open gate 3', 'open exit', 'open gate three', 'activate gate 3'],
                handler: () => this.handleOpenGate3()
            },
            deploySecurity: {
                patterns: ['deploy security', 'send guard', 'deploy personnel', 'send security'],
                handler: () => this.handleDeploySecurity()
            },
            closeGate1: {
                patterns: ['close gate 1', 'restrict gate 1', 'close gate one', 'block gate 1'],
                handler: () => this.handleCloseGate1()
            },
            evacuation: {
                patterns: ['evacuation', 'evacuate', 'trigger evacuation', 'start evacuation'],
                handler: () => this.handleEvacuation()
            },
            redirect: {
                patterns: ['redirect crowd', 'reroute crowd', 'change route', 'redirect flow'],
                handler: () => this.handleRedirectCrowd()
            },
            clear: {
                patterns: ['clear', 'reset', 'clear all', 'reset system'],
                handler: () => this.handleClear()
            },
            heatmap: {
                patterns: ['show heatmap', 'enable heatmap', 'display heatmap'],
                handler: () => this.handleToggleHeatmap(true)
            },
            hideHeatmap: {
                patterns: ['hide heatmap', 'disable heatmap', 'turn off heatmap'],
                handler: () => this.handleToggleHeatmap(false)
            },
            status: {
                patterns: ['status', 'what is status', 'system status', 'how are things'],
                handler: () => this.handleStatus()
            }
        };
    }

    /**
     * Process a voice command
     */
    processCommand(commandText) {
        try {
            if (!commandText || typeof commandText !== 'string') {
                throw new Error('Invalid command text');
            }

            if (this.isProcessing) {
                console.warn('Command already processing');
                return false;
            }

            this.isProcessing = true;
            const cmd = commandText.toLowerCase().trim();

            // Log command
            appState.addLog('Operator Speech', `Voice command input: "${commandText}"`, 'system');
            if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
                backendClient.sendEventLog('voice_command', 'info', commandText, 'operator_console');
            }

            // Match against patterns
            for (const [key, config] of Object.entries(this.commandPatterns)) {
                for (const pattern of config.patterns) {
                    if (cmd.includes(pattern)) {
                        config.handler();
                        this.isProcessing = false;
                        return true;
                    }
                }
            }

            // Command not recognized
            this.handleUnrecognizedCommand(cmd);
            this.isProcessing = false;
            return false;
        } catch (error) {
            console.error('Error processing voice command:', error);
            appState.addLog('Voice Control', 'Error: Failed to process command', 'danger');
            this.isProcessing = false;
            return false;
        }
    }

    /**
     * Handle: Open Gate 3
     * @private
     */
    handleOpenGate3() {
        try {
            appState.setIntervention('gate3Open', true);
            appState.setScenario('normal');
            appState.addLog('Voice Control', 'Success: Gate 3 exits opened', 'info');
            if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
                backendClient.sendAction('open_gate_3', 'operator_console', true);
            }
            uiManager.updatePhoneAlert('Gate Status', 'Gate 3 exits are now OPEN', 'safe');
        } catch (error) {
            console.error('Error in handleOpenGate3:', error);
            appState.addLog('Voice Control', 'Error: Failed to open Gate 3', 'danger');
        }
    }

    /**
     * Handle: Deploy Security
     * @private
     */
    handleDeploySecurity() {
        try {
            appState.setIntervention('securityDeployed', true);
            const securityStaff = appState.get('securityStaff') || [];
            const canvasW = document.getElementById('digitalTwinCanvas')?.width || CONFIG.CANVAS.WIDTH;
            const canvasH = document.getElementById('digitalTwinCanvas')?.height || CONFIG.CANVAS.HEIGHT;

            // Move security to bottleneck
            if (securityStaff.length > 0) {
                securityStaff[0].targetX = canvasW / 2 - 40;
                securityStaff[0].targetY = canvasH / 2;
            }
            if (securityStaff.length > 1) {
                securityStaff[1].targetX = canvasW / 2 + 40;
                securityStaff[1].targetY = canvasH / 2;
            }

            appState.addLog('Voice Control', 'Success: Security deployed to bottleneck', 'info');
            if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
                backendClient.sendAction('deploy_security', 'operator_console', true);
            }
            uiManager.showNotification('Security personnel deployed', 'info');
        } catch (error) {
            console.error('Error in handleDeploySecurity:', error);
            appState.addLog('Voice Control', 'Error: Failed to deploy security', 'danger');
        }
    }

    /**
     * Handle: Close Gate 1
     * @private
     */
    handleCloseGate1() {
        try {
            appState.setIntervention('gate1Closed', true);
            appState.addLog('Voice Control', 'Success: Gate 1 input restricted', 'info');
            if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
                backendClient.sendAction('close_gate_1', 'operator_console', true);
            }
            uiManager.updatePhoneAlert('Gate Status', 'Gate 1 entrance is now CLOSED', 'warning');
        } catch (error) {
            console.error('Error in handleCloseGate1:', error);
            appState.addLog('Voice Control', 'Error: Failed to close Gate 1', 'danger');
        }
    }

    /**
     * Handle: Evacuation
     * @private
     */
    handleEvacuation() {
        try {
            appState.setIntervention('evacuating', true);
            appState.setIntervention('gate3Open', true);
            appState.setIntervention('gate1Closed', true);

            // Trigger audio announcement
            playCurrentAnnouncement();

            appState.addLog('Voice Control', 'Critical: Evacuation routing engaged', 'danger');
            if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
                backendClient.sendAction('trigger_evacuation', 'operator_console', true);
            }
            uiManager.updatePhoneAlert('🚨 EVACUATION', 'Emergency evacuation in progress. Follow exit routes immediately', 'danger');
        } catch (error) {
            console.error('Error in handleEvacuation:', error);
            appState.addLog('Voice Control', 'Error: Failed to trigger evacuation', 'danger');
        }
    }

    /**
     * Handle: Redirect Crowd
     * @private
     */
    handleRedirectCrowd() {
        try {
            appState.setIntervention('crowdRedirected', true);
            appState.addLog('Voice Control', 'Success: Crowd flow redirected', 'info');
            if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
                backendClient.sendAction('redirect_crowd', 'operator_console', true);
            }
            uiManager.showNotification('Crowd flow redirected', 'info');
        } catch (error) {
            console.error('Error in handleRedirectCrowd:', error);
            appState.addLog('Voice Control', 'Error: Failed to redirect crowd', 'danger');
        }
    }

    /**
     * Handle: Clear/Reset
     * @private
     */
    handleClear() {
        try {
            appState.setScenario('normal');
            appState.reset();
            appState.addLog('Voice Control', 'Success: System reset to normal', 'info');
            uiManager.showNotification('System cleared', 'info');
        } catch (error) {
            console.error('Error in handleClear:', error);
            appState.addLog('Voice Control', 'Error: Failed to clear system', 'danger');
        }
    }

    /**
     * Handle: Toggle Heatmap
     * @private
     */
    handleToggleHeatmap(visible) {
        try {
            uiManager.toggleHeatmap(visible);
            const action = visible ? 'enabled' : 'disabled';
            appState.addLog('Voice Control', `Heatmap ${action}`, 'info');
        } catch (error) {
            console.error('Error in handleToggleHeatmap:', error);
        }
    }

    /**
     * Handle: System Status
     * @private
     */
    handleStatus() {
        try {
            const metrics = appState.get('metrics');
            const scenario = appState.get('currentScenario');
            const particles = appState.get('particles') || [];

            let status = `System Status: ${scenario} | `;
            status += `Crowd: ${particles.length} people | `;
            status += `Risk: ${metrics.stampedeLikelihood}%`;

            appState.addLog('System Status', status, 'system');
            uiManager.showNotification(status, 'info');
        } catch (error) {
            console.error('Error in handleStatus:', error);
        }
    }

    /**
     * Handle: Unrecognized Command
     * @private
     */
    handleUnrecognizedCommand(cmd) {
        try {
            const suggestion = this.getSuggestion();
            appState.addLog('Voice Control', `Error: Command not recognized. ${suggestion}`, 'warning');
            uiManager.showNotification('Command not recognized', 'warning');
        } catch (error) {
            console.error('Error in handleUnrecognizedCommand:', error);
        }
    }

    /**
     * Get suggestion for next command
     * @private
     */
    getSuggestion() {
        const suggestions = [
            'Try "open gate 3"',
            'Try "deploy security"',
            'Try "trigger evacuation"',
            'Try "status"'
        ];
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    /**
     * Simulate voice recognition (for testing)
     */
    simulateVoiceInput() {
        try {
            const commands = [
                'open gate 3',
                'deploy security units',
                'close gate 1',
                'trigger evacuation mode',
                'redirect crowd'
            ];
            const randomCmd = commands[Math.floor(Math.random() * commands.length)];
            return randomCmd;
        } catch (error) {
            console.error('Error simulating voice input:', error);
            return 'open gate 3';
        }
    }
}

// Global voice command processor
const voiceCommandProcessor = new VoiceCommandProcessor();

/**
 * Main function to run voice command from UI
 */
function runVoiceCommand(commandText) {
    try {
        if (!commandText || !commandText.trim()) {
            console.warn('Empty command text');
            return false;
        }
        return voiceCommandProcessor.processCommand(commandText);
    } catch (error) {
        console.error('Error running voice command:', error);
        return false;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoiceCommandProcessor, voiceCommandProcessor, runVoiceCommand };
}
