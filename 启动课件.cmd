@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Please install Node.js 22.12 or newer.
  pause
  exit /b 1
)
node scripts\launch.mjs
if errorlevel 1 pause
