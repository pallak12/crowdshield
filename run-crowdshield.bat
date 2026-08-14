@echo off
REM Starts the CrowdShield frontend and backend together on Windows
cd /d "%~dp0"
echo Starting frontend on http://localhost:8000
start "CrowdShield Frontend" cmd /k "python -m http.server 8000"
echo Starting backend on http://localhost:4000
start "CrowdShield Backend" cmd /k "cd backend && npm start"
echo Done. Two windows should open for frontend and backend.
pause
