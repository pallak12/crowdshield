# CrowdShield Demo Video Script

## Goal
Create a short demo video showing the prototype workflow, architecture, and data ethics highlights.

## Video Length
- Target: 3 to 5 minutes

## Sections

### 1. Introduction (15-20 seconds)
- Present the project name: CrowdShield.
- State the mission: enabling safer crowd control with an AI-enabled dashboard.
- Mention the deliverables: prototype, architecture, documentation, privacy guidance.

### 2. User Interface Walkthrough (40-50 seconds)
- Show the dashboard panels: risk indicators, recommendations, voice command section.
- Explain the live digital twin map and mobile companion.
- Point out scenario buttons and incident reporting form.

### 3. Backend Integration (40-50 seconds)
- Explain the secure backend stub in `backend/server.js`.
- Show how `config.js` configures `BACKEND.BASE_URL` and `BACKEND.API_TOKEN`.
- Demonstrate a voice command or action and mention the event/action request flow.

### 4. Data Ethics & Privacy (30 seconds)
- Highlight `DATA_PRIVACY.md` and the privacy-first design.
- Mention backend redaction, bearer token auth, CORS, and rate limiting.
- Explain minimal metadata collection and no raw sensitive voice transcripts stored.

### 5. Demo Scenario (60-80 seconds)
- Simulate a crowd risk scenario using the dashboard.
- Trigger a command such as "open gate 3" or "deploy security".
- Submit an incident report and note the log entry.
- Show recommendation update and any UI update.

### 6. Closing & Next Steps (20-30 seconds)
- Summarize what CrowdShield delivers.
- Mention that source code, architecture, and documentation are included in the repo.
- Call out the next steps: real sensor integration, authenticated operator portal, cloud deployment.

## Recording Notes
- Use screen capture tool to record the browser and terminal.
- Keep the camera motion smooth and focus on the UI.
- Use concise narration and avoid long pauses.
- If a live backend cannot be deployed in the recording, explain the backend stub concept clearly.
