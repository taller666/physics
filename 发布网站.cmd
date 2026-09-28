@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "NOTES_NODE="
for /f "delims=" %%N in ('where.exe node.exe 2^>nul') do if not defined NOTES_NODE set "NOTES_NODE=%%N"
if not defined NOTES_NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NOTES_NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NOTES_NODE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NOTES_NODE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
if not defined NOTES_NODE if exist "D:\Develop\node\node.exe" set "NOTES_NODE=D:\Develop\node\node.exe"
if not defined NOTES_NODE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NOTES_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined NOTES_NODE (
  echo 未找到 Node.js。请安装 Node.js 22.16 或更新版本后重新打开此窗口。
  pause
  exit /b 1
)
"%NOTES_NODE%" "%~dp0scripts\publish-site.mjs" %*
set "NOTE_EXIT_CODE=%ERRORLEVEL%"
echo.
pause
exit /b %NOTE_EXIT_CODE%
