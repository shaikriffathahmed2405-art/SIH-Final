@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Green Roof AI - Full-Stack Application
echo ======================================================
echo   Green Roof AI — Starting Decoupled Frontend & Backend
echo ======================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found on this computer.
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODEVER=%%v
echo Node.js found: %NODEVER%
echo.

echo Checking and freeing ports 8787 and 3000 if needed...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8787" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>nul
)
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>nul
)

echo Starting Backend REST API on http://localhost:8787 ...
echo Starting Frontend Web Client on http://localhost:3000 ...
echo.

timeout /t 2 >nul
start "" "http://localhost:3000"

node start-dev.js

echo.
echo [SERVER STOPPED]
pause
