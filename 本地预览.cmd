@echo off
chcp 65001 >nul
cd /d "%~dp0"
call npm.cmd run dev
set "NOTE_EXIT_CODE=%ERRORLEVEL%"
if not "%NOTE_EXIT_CODE%"=="0" pause
exit /b %NOTE_EXIT_CODE%
