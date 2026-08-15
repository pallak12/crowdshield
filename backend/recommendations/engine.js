// backend/recommendations/engine.js
class RecommendationEngine {
    constructor() {
        this.rules = [
            {
                condition: (state) => state.density > 0.8,
                action: 'OPEN_ALTERNATE_EXITS',
                message: 'Open Gates 3, 4, and 5 to relieve pressure'
            },
            {
                condition: (state) => state.incoming_flow > state.outgoing_flow * 1.5,
                action: 'CLOSE_ENTRY_GATES',
                message: 'Temporarily close Entry Gate A'
            },
            {
                condition: (state) => state.crush_likelihood > 0.6,
                action: 'DEPLOY_SECURITY',
                message: 'Deploy 10 additional personnel to Sector B'
            },
            {
                condition: (state) => state.panic_index > 0.7,
                action: 'BROADCAST_ANNOUNCEMENT',
                message: 'Announce: "Please maintain calm. Move slowly towards Exit C."'
            }
        ];
    }

    generateRecommendations(state) {
        return this.rules
            .filter(rule => rule.condition(state))
            .map(rule => ({
                action: rule.action,
                message: rule.message,
                priority: this.calculatePriority(rule, state)
            }))
            .sort((a, b) => b.priority - a.priority);
    }
}