# CrowdShield Backend Stub

This folder contains a minimal secure backend stub for CrowdShield. It is intended to show a safe integration pattern for receiving event logs and action requests from the front-end.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Copy the environment example:

```bash
cp .env.example .env
```

3. Edit `.env` and set a strong `API_TOKEN`.

4. Start the backend:

```bash
npm start
```

The backend will listen on the port configured in `.env` (default `4000`).

## API Endpoints

### GET /health

Returns a simple health check.

### POST /api/log

Accepts structured event logs from the front-end. Example payload:

```json
{
  "eventType": "voice_command",
  "level": "info",
  "details": "deploy security units",
  "source": "operator_console"
}
```

The stub enforces:
- Bearer token authorization
- Origin restrictions
- Rate limiting
- Event validation and metadata-only storage

### POST /api/action

Accepts an approved action request from the front-end. Example payload:

```json
{
  "action": "deploy_security",
  "requester": "operator-1",
  "confirmation": true
}
```

The server accepts only whitelisted actions and requires `confirmation: true`.

### GET /api/recommendations

Returns a sample recommendation payload for operator workflows.

## Security Notes

- Do not store API tokens in source control.
- Use HTTPS/TLS in production.
- The stub stores logs in memory for demonstration only.
- For production, add persistent audit logging, encryption, and access controls.

## Integration

Update your front-end to send logs and action requests to the backend via `Authorization: Bearer <API_TOKEN>`.

This backend stub is a starting point for secure deployment, not a complete production service.
