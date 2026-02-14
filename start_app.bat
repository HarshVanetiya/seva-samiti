@echo off
cd /d "%~dp0"

echo Starting Server...
start "Seva Smiti Server" cmd /k "cd server && npm run dev"

echo Starting Client...
start "Seva Smiti Client" cmd /k "cd client && npm run dev"

echo Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo Opening Application in Browser...
start http://localhost:5173

echo Done!
