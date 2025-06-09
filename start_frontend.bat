@echo off
echo Starting Employee Wellbeing Platform Frontend...

REM Get the full path to the index.html file
set PROJECT_DIR=%~dp0
set FRONTEND_PATH=file:///%PROJECT_DIR%Frontend\index.html

REM Replace backslashes with forward slashes for URL format
set FRONTEND_PATH=%FRONTEND_PATH:\=/%

echo Opening frontend at: %FRONTEND_PATH%
start msedge --new-window "%FRONTEND_PATH%"
echo Frontend started in a new Edge window
