/**
 * CROWDSHIELD EVENT HANDLERS
 * Centralized event listener setup with proper cleanup
 */

class EventManager {
    constructor() {
        try {
            this.listeners = [];
            this.initialized = false;
        } catch (error) {
            console.error('Error initializing EventManager:', error);
        }
    }

    /**
     * Initialize all event listeners
     */
    init() {
        try {
            if (this.initialized) {
                console.warn('EventManager already initialized');
                return;
            }

            this.setupWindowListeners();
            this.setupCanvasControls();
            this.setupScenarioButtons();
            this.setupVoiceCommandListeners();
            this.setupMapControls();
            this.setupPhoneListeners();
            this.setupIncidentForm();

            this.initialized = true;
            console.log('EventManager initialized successfully');
        } catch (error) {
            console.error('Error initializing EventManager:', error);
        }
    }

    /**
     * Setup window/document level listeners
     * @private
     */
    setupWindowListeners() {
        try {
            // Handle window resize with debounce
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const dims = canvasRenderer.resize();
                    initializeVenueConfig(dims.width, dims.height);
                }, 250);
            });

            // Handle visibility changes
            document.addEventListener('visibilitychange', () => {
                const isVisible = !document.hidden;
                console.log(`App ${isVisible ? 'visible' : 'hidden'}`);
            });
        } catch (error) {
            console.error('Error setting up window listeners:', error);
        }
    }

    /**
     * Setup canvas control buttons
     * @private
     */
    setupCanvasControls() {
        try {
            const heatmapBtn = document.getElementById('btnToggleHeatmap');
            const riskZonesBtn = document.getElementById('btnToggleRiskZones');

            if (heatmapBtn) {
                heatmapBtn.addEventListener('click', (e) => {
                    const isActive = !e.currentTarget.classList.contains('active');
                    uiManager.toggleHeatmap(isActive);
                });
                heatmapBtn.setAttribute('aria-label', 'Toggle heatmap visibility');
            }

            if (riskZonesBtn) {
                riskZonesBtn.addEventListener('click', (e) => {
                    const isActive = !e.currentTarget.classList.contains('active');
                    uiManager.toggleRiskZones(isActive);
                });
                riskZonesBtn.setAttribute('aria-label', 'Toggle risk zones visibility');
            }
        } catch (error) {
            console.error('Error setting up canvas controls:', error);
        }
    }

    /**
     * Setup scenario selection buttons
     * @private
     */
    setupScenarioButtons() {
        try {
            const scenarios = [
                { id: 'btnNormalFlow', scenario: 'normal' },
                { id: 'btnCrowdSurge', scenario: 'surge' },
                { id: 'btnGateBlockage', scenario: 'blockage' },
                { id: 'btnPanic', scenario: 'panic' }
            ];

            scenarios.forEach(({ id, scenario }) => {
                const btn = document.getElementById(id);
                if (btn) {
                    btn.addEventListener('click', () => {
                        appState.setScenario(scenario);
                        handleScenarioChange(scenario);
                    });
                    btn.setAttribute('aria-label', `Activate ${scenario} scenario`);
                }
            });
        } catch (error) {
            console.error('Error setting up scenario buttons:', error);
        }
    }

    /**
     * Setup voice command listeners
     * @private
     */
    setupVoiceCommandListeners() {
        try {
            const voiceInput = document.getElementById('voiceCommandInput');
            const voiceMicBtn = document.getElementById('voiceMicBtn');

            // Voice input enter key
            if (voiceInput) {
                voiceInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const command = voiceInput.value;
                        runVoiceCommand(command);
                        voiceInput.value = '';
                    }
                });
                voiceInput.setAttribute('aria-label', 'Voice command input field');
            }

            // Voice mic button simulator
            if (voiceMicBtn) {
                voiceMicBtn.addEventListener('click', () => {
                    try {
                        voiceMicBtn.classList.add('recording');
                        appState.addLog('Voice Command', 'Listening for operator voice command...', 'info');

                        setTimeout(() => {
                            voiceMicBtn.classList.remove('recording');
                            const simulatedCmd = voiceCommandProcessor.simulateVoiceInput();
                            voiceInput.value = simulatedCmd;
                            runVoiceCommand(simulatedCmd);
                            voiceInput.value = '';
                        }, 1500);
                    } catch (error) {
                        console.error('Error in voice mic click:', error);
                        voiceMicBtn.classList.remove('recording');
                    }
                });
                voiceMicBtn.setAttribute('aria-label', 'Simulate voice input');
            }

            // Preset voice commands
            const presetTags = document.querySelectorAll('.preset-tag');
            presetTags.forEach(tag => {
                tag.addEventListener('click', () => {
                    const command = tag.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                    if (command) {
                        runVoiceCommand(command);
                    }
                });
            });
        } catch (error) {
            console.error('Error setting up voice command listeners:', error);
        }
    }

    /**
     * Setup map control buttons
     * @private
     */
    setupMapControls() {
        try {
            const interventionBtns = document.querySelectorAll('.intervention-btn');
            
            interventionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.getAttribute('data-action');
                    handleMapIntervention(action);
                    btn.classList.toggle('applied');
                });
                btn.setAttribute('aria-label', `${btn.textContent} intervention`);
            });
        } catch (error) {
            console.error('Error setting up map controls:', error);
        }
    }

    /**
     * Setup phone app listeners
     * @private
     */
    setupPhoneListeners() {
        try {
            // Citizen walk button
            const citizenWalkBtn = document.getElementById('btnSimulateCitizenWalk');
            if (citizenWalkBtn) {
                citizenWalkBtn.addEventListener('click', toggleCitizenWalk);
                citizenWalkBtn.setAttribute('aria-label', 'Toggle citizen walk simulation');
            }

            // Announcement language select
            const langSelect = document.getElementById('announcementLangSelect');
            if (langSelect) {
                langSelect.addEventListener('change', changeAnnouncementLanguage);
                langSelect.setAttribute('aria-label', 'Select announcement language');
            }

            // Play announcement button
            const playBtn = document.getElementById('btnPlayAnnouncement');
            if (playBtn) {
                playBtn.addEventListener('click', playCurrentAnnouncement);
                playBtn.setAttribute('aria-label', 'Play warning announcement');
            }

            // SOS button
            const sosBtn = document.querySelector('.sos-button');
            if (sosBtn) {
                sosBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to trigger SOS? This will send your GPS location to security.')) {
                        appState.addLog('Emergency', 'SOS triggered! GPS location broadcasting to security staff', 'danger');
                        uiManager.showNotification('SOS activated', 'danger');
                    }
                });
            }
        } catch (error) {
            console.error('Error setting up phone listeners:', error);
        }
    }

    /**
     * Setup incident report form
     * @private
     */
    setupIncidentForm() {
        try {
            const incidentForm = document.getElementById('incidentReportForm');
            if (incidentForm) {
                incidentForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    submitIncidentReport(e);
                });
            }
        } catch (error) {
            console.error('Error setting up incident form:', error);
        }
    }

    /**
     * Cleanup all listeners (for testing/cleanup)
     */
    cleanup() {
        try {
            this.initialized = false;
            // Listeners are automatically cleaned up when elements are removed
            console.log('EventManager cleaned up');
        } catch (error) {
            console.error('Error cleaning up EventManager:', error);
        }
    }
}

// Global event manager instance
const eventManager = new EventManager();

/**
 * Handle scenario change
 */
function handleScenarioChange(scenario) {
    try {
        appState.setScenario(scenario);
        appState.resetMetrics();
        appState.clearRecommendations();

        // Reset particles
        const particleSystem = window.particleSystem;
        if (particleSystem) {
            particleSystem.reset();
        }

        // Reset all interventions
        appState.setIntervention('gate3Open', scenario !== 'blockage');
        appState.setIntervention('gate1Closed', false);
        appState.setIntervention('securityDeployed', false);
        appState.setIntervention('crowdRedirected', false);
        appState.setIntervention('evacuating', false);

        // Reset security units to home bases
        const canvas = document.getElementById('digitalTwinCanvas');
        if (canvas && typeof initializeSecurityUnits === 'function') {
            initializeSecurityUnits(canvas.width, canvas.height);
        }

        // Update button states
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const btnMap = {
            'normal': 'btnNormalFlow',
            'surge': 'btnCrowdSurge',
            'blockage': 'btnGateBlockage',
            'panic': 'btnPanic'
        };

        const btn = document.getElementById(btnMap[scenario]);
        if (btn) btn.classList.add('active');

        // Log scenario change
        const scenarioMessages = {
            'normal': 'Normal Flow Activated. Stable visitor routing applied.',
            'surge': 'Crowd Surge Scenario Activated. Inflow multiplied.',
            'blockage': 'Exit Gate Blockage Scenario Activated (Gate 3 Closed).',
            'panic': 'Panic Propagation Scenario Activated. Disturbance reported.'
        };

        appState.addLog('Scenario', scenarioMessages[scenario], 
            scenario === 'panic' ? 'danger' : 'warning');


        if (typeof updateMetrics === 'function') {
            updateMetrics();
        }

        // Handle panic induction (delayed so particles have spawned)
        if (scenario === 'panic' && particleSystem) {
            setTimeout(() => {
                // Ensure we are still in panic scenario
                if (appState.get('currentScenario') === 'panic') {
                    const canvas = document.getElementById('digitalTwinCanvas');
                    if (canvas) {
                        particleSystem.inducePanic(
                            canvas.width / 2,
                            canvas.height / 2,
                            120
                        );
                    }
                }
            }, 2000); // 2 seconds delay
        }
    } catch (error) {
        console.error('Error handling scenario change:', error);
    }
}

/**
 * Handle map intervention
 */
function handleMapIntervention(action) {
    try {
        if (!action) return;
        runVoiceCommand(action);
    } catch (error) {
        console.error('Error handling map intervention:', error);
    }
}

/**
 * Toggle citizen walk simulation
 */
function toggleCitizenWalk() {
    try {
        const isActive = appState.get('citizenActive');
        appState.set('citizenActive', !isActive);

        const btn = document.getElementById('btnSimulateCitizenWalk');
        const btnText = document.getElementById('citizenWalkBtnText');

        if (btnText) {
            btnText.innerText = !isActive ? 'Remove Citizen from Map' : 'Place Citizen on Venue Map';
        }

        appState.addLog('System', 
            `Citizen walk simulation ${!isActive ? 'started' : 'ended'}`, 
            'info');
    } catch (error) {
        console.error('Error toggling citizen walk:', error);
    }
}

/**
 * Change announcement language
 */
function changeAnnouncementLanguage() {
    try {
        const langSelect = document.getElementById('announcementLangSelect');
        const lang = langSelect?.value || 'en';
        appState.addLog('System Speech', 
            `Public announcement language switched to ${lang.toUpperCase()}`, 
            'info');
    } catch (error) {
        console.error('Error changing announcement language:', error);
    }
}

/**
 * Play announcement
 */
function playCurrentAnnouncement() {
    try {
        const langSelect = document.getElementById('announcementLangSelect');
        const lang = langSelect?.value || 'en';

        const announcementsText = {
            en: 'Attention please. High congestion at the central corridor. Please move slowly and use Gate 3 exits.',
            hi: 'कृपया ध्यान दें। मध्य मार्ग पर भारी भीड़ है। कृपया धीरे चलें और गेट नंबर 3 निकास का उपयोग करें।',
            ta: 'கவனியுங்கள். மத்தியப் பாதையில் அதிக நெரிசல் உள்ளது. தயவுசெய்து மெதுவாகச் சென்று கேட் 3-ஐப் பயன்படுத்தவும்.',
            bn: 'দয়া করে শুনুন। মাঝের রাস্তায় অত্যন্ত ভিড় রয়েছে। অনুগ্রহ করে ধীরে চলুন এবং গেট ৩ ব্যবহার করুন।'
        };

        const text = announcementsText[lang];

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            
            const langMap = { hi: 'hi-IN', ta: 'ta-IN', bn: 'bn-IN', en: 'en-US' };
            utterance.lang = langMap[lang] || 'en-US';
            utterance.rate = CONFIG.SPEECH.RATE;

            utterance.onstart = () => {
                appState.set('isSpeaking', true);
                uiManager.updateAudioStatus(true, 'Broadcasting Warning...');
            };

            utterance.onend = () => {
                appState.set('isSpeaking', false);
                uiManager.updateAudioStatus(false);
            };

            window.speechSynthesis.speak(utterance);

            // Update phone alert
            uiManager.updatePhoneAlert('AUDIO ANNOUNCEMENT', text, 'audio');

            appState.addLog('Public Broadcast', `Triggered announcement: "${text}"`, 'recommendation');
        } else {
            appState.addLog('System Speech', 'Error: Speech synthesis not supported', 'warning');
        }
    } catch (error) {
        console.error('Error playing announcement:', error);
        appState.addLog('System Speech', 'Error: Failed to play announcement', 'danger');
    }
}

/**
 * Submit incident report
 */
function submitIncidentReport(event) {
    try {
        event.preventDefault();

        const incidentType = document.getElementById('incidentType')?.value;
        const location = document.getElementById('incidentLocation')?.value;
        const details = document.getElementById('incidentDetails')?.value;

        if (!incidentType || !location) {
            appState.addLog('Incident Report', 'Error: Required fields not filled', 'warning');
            return;
        }

        const summary = `${incidentType} reported at ${location}: ${details || 'No additional details'}`;
        appState.addLog('Incident Report', summary, 'danger');

        if (typeof backendClient !== 'undefined' && backendClient.isEnabled()) {
            backendClient.sendEventLog('system_event', 'danger', summary, 'operator_console');
        }

        uiManager.showNotification('Incident report submitted to control room', 'info');

        // Reset form
        document.getElementById('incidentReportForm')?.reset();
    } catch (error) {
        console.error('Error submitting incident report:', error);
        appState.addLog('Incident Report', 'Error: Failed to submit report', 'danger');
    }
}

/**
 * Scroll to incident form (mobile)
 */
function scrollToIncidentForm() {
    try {
        const form = document.getElementById('incidentReportForm');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error scrolling to incident form:', error);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventManager, eventManager };
}
