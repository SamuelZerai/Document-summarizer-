@echo off
start ollama serve

:wait
curl -s http://localhost:11434 >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto wait
)

start "" node "%~dp0server.js"

timeout /t 1 /nobreak >nul
start "" "http://localhost:3000"
