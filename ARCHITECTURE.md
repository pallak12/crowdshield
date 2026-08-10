# CrowdShield Architecture

## System Overview

CrowdShield is a prototype crowd management system built as a web-based control dashboard with a secure backend stub for reporting and action requests.

- Frontend: Static web application served from `index.html` with HTML, CSS, and JavaScript.
- Backend: Node.js stub in `backend/server.js` that accepts secure event logs and whitelisted action requests.
- Data flow: Operator actions and incident reports flow from the browser through `backend-client.js` to backend REST endpoints.

## Key Components

### Frontend Modules

- `index.html`
  - Main user interface and page layout.
  - References scripts in the correct load order.

- `styles.css`
  - Visual styling and responsive layout.
  - Supports desktop, tablet, and mobile views.

- `config.js`
  - Central app configuration and constants.
  - Includes backend URL and API token placeholders.

- `app.js`
  - Main application entry point.
  - Initializes rendering, state, event listeners, simulation loops, and backend recommendation loading.
  - Calculates metrics, risk status, and AI-style recommendations.

- `state.js`
  - Central `StateManager` class.
  - Stores app state, logs, metrics, recommendations, and interventions.
  - Notifies listeners on changes and maintains consistent UI sync.

- `ui-updates.js`
  - `UIManager` class for DOM updates.
  - Updates dashboard gauges, logs, recommendations, notification cards, and mobile companion displays.

- `voice-commands.js`
  - Voice command parser and command handlers.
  - Maps natural language command text to actions such as open gate, deploy security, trigger evacuation, and redirect crowd.
  - A command suggestion system improves usability.

- `events.js`
  - `EventManager` class to wire UI interactions.
  - Handles scenario buttons, voice input, map controls, phone UI, incident report form, and window resize.

- `backend-client.js`
  - Secure frontend client for backend integration.
  - Sends `POST /api/log` and `POST /api/action` requests.
  - Fetches backend recommendations from `GET /api/recommendations`.
  - Requires `CONFIG.BACKEND.BASE_URL` and `CONFIG.BACKEND.API_TOKEN`.

### Backend Stub

- `backend/server.js`
  - Express application with security middleware.
  - Uses `helmet` for response headers.
  - Uses `cors` to restrict allowed origins.
  - Uses `express-rate-limit` to prevent abuse.
  - Uses `dotenv` for configuration.
  - Authorizes requests using bearer token from `API_TOKEN`.

- `backend/.env.example`
  - Example env file for local configuration.

- `backend/package.json`
  - Backend dependencies and startup script.

## Data Flow

```text
User interacts with UI
        │
        ▼
Frontend modules
  - voice-commands.js
  - events.js
  - app.js
  - state.js
  - ui-updates.js
        │
        ▼
backend-client.js
  - buildHeaders()
  - sendEventLog()
  - sendAction()
  - fetchRecommendations()
        │
        ▼
Backend stub endpoints
  - POST /api/log
  - POST /api/action
  - GET /api/recommendations
        │
        ▼
Event/action storage
  - in-memory arrays in backend server
  - safe redaction and validation
```

## Module Responsibilities

- `config.js`
  - Store environment values, UI interval settings, canvas dimensions, thresholds, and backend configuration.

- `state.js`
  - Provide a single truth source for simulation and UI state.
  - Keep log history and recommendations in sync.

- `app.js`
  - Manage initialization and simulation loops.
  - Provide risk scoring and recommendation logic.

- `ui-updates.js`
  - Render state changes to the page in real time.

- `voice-commands.js`
  - Interpret operator commands and translate them into app actions.

- `events.js`
  - Connect UI controls to app behavior and simulation state.

- `backend-client.js`
  - Encapsulate backend call behavior and secure request headers.

- `backend/server.js`
  - Validate, authorize, and log incoming event and action requests.

## Third-Party APIs and Libraries

### Frontend
- `lucide` icon CDN
- Browser Web Speech API (`SpeechSynthesisUtterance`) for announcements
- Native `fetch` for network requests

### Backend
- `express` - HTTP server framework
- `helmet` - security headers
- `cors` - origin policy enforcement
- `express-rate-limit` - request throttling
- `dotenv` - environment configuration

## Security and Compliance

- Bearer token authorization for backend endpoints.
- CORS policy restricted to configured origins.
- Rate limiting to prevent abusive request patterns.
- Payload validation for event logs and action requests.
- Minimal text retention, with voice-related details redacted before storing.
- No sensitive user identity or raw location data is stored in the current prototype.

## Mobile App & Reporting Portal

The prototype includes:
- Mobile-friendly UI and dashboard simulation.
- Incident reporting form for users to submit crowd issues.
- Operator control panel for voice and button-driven actions.
- Backend stub representing a reporting portal endpoint.

## Running the System

1. Open `index.html` in a browser or serve via simple HTTP server.
2. Start the backend stub from `backend/` with `npm install` and `npm start`.
3. Set `CONFIG.BACKEND.BASE_URL` and `CONFIG.BACKEND.API_TOKEN` in `config.js`.
4. Use the dashboard to simulate scenarios and submit incident reports.
