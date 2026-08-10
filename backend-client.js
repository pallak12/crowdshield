const backendClient = (() => {
    const baseUrl = CONFIG?.BACKEND?.BASE_URL || '';
    const apiToken = CONFIG?.BACKEND?.API_TOKEN || '';
    const enabled = Boolean(baseUrl && apiToken);

    function buildHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (apiToken) {
            headers.Authorization = `Bearer ${apiToken}`;
        }
        return headers;
    }

    async function sendRequest(path, payload) {
        if (!enabled) {
            console.warn('Backend client disabled: missing backend URL or API token.');
            return null;
        }

        try {
            const response = await fetch(`${baseUrl}${path}`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(payload),
                credentials: 'omit'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`Backend request failed (${path}):`, response.status, errorText);
                return null;
            }

            return response.json();
        } catch (error) {
            console.warn(`Unable to reach backend (${path}):`, error);
            return null;
        }
    }

    async function sendEventLog(eventType, level, details, source) {
        const payload = {
            eventType,
            level,
            details,
            source
        };

        return sendRequest('/api/log', payload);
    }

    async function sendAction(action, requester, confirmation = false) {
        const payload = {
            action,
            requester,
            confirmation
        };

        return sendRequest('/api/action', payload);
    }

    async function fetchRecommendations() {
        if (!enabled) {
            return null;
        }

        try {
            const response = await fetch(`${baseUrl}/api/recommendations`, {
                method: 'GET',
                headers: buildHeaders(),
                credentials: 'omit'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('Backend recommendations request failed:', response.status, errorText);
                return null;
            }

            const json = await response.json();
            return json?.recommendations || null;
        } catch (error) {
            console.warn('Unable to fetch backend recommendations:', error);
            return null;
        }
    }

    return {
        isEnabled: () => enabled,
        sendEventLog,
        sendAction,
        fetchRecommendations
    };
})();

