# CrowdShield

AI Early Warning & Mitigation System for Crowd Control — a front-end prototype with visual simulation and UI for monitoring venues.

Live preview (after Pages deploy):
https://pallak12.github.io/crowdshield/

## Quick start (local)

1. Serve with Python (simple, no build tools):

   ```bash
   python -m http.server 8000
   # then open http://localhost:8000 in your browser
   ```

2. Or open `index.html` directly in your browser (some features may require a server due to CORS/asset loading).

## Secure backend integration (optional)

This repository includes a minimal secure backend stub in the `backend/` folder. It demonstrates a safe pattern for receiving operator logs and action requests, while enforcing authorization, origin checks, and rate limiting.

### Run the backend stub

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set a strong API_TOKEN
npm start
```

To enable front-end integration with the backend stub, open `config.js` and set `BACKEND.BASE_URL` to the backend endpoint and `BACKEND.API_TOKEN` to the same token used by the backend.

### API usage

- `POST /api/log` — receive structured log events from the front-end
- `POST /api/action` — accept whitelisted action requests with confirmation
- `GET /api/recommendations` — return operator guidance payloads

The backend stub uses `Authorization: Bearer <API_TOKEN>` and only allows requests from configured origins.

## Data privacy and ethics

Read `DATA_PRIVACY.md` for the project privacy policy, data minimization guidance, and deployment considerations.

## Contributing
- Fix issues, open PRs against `main`.
- Run linters or tests if added.

## License
License: MIT (add a LICENSE file if desired)

