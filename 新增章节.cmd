@echo off
chcp 65001 >nul
cd /d "%~dp0"
node scripts/new-chapter.mjs %*
set "NOTE_EXIT_CODE=%ERRORLEVEL%"
echo.
pause
exit /b %NOTE_EXIT_CODE%
