@echo off
REM Quick Start Script for AI Technical Interviewer
REM Run this from the project root directory

echo.
echo ========================================
echo   AI Technical Interviewer
echo   Mock Candidate Quick Start
echo ========================================
echo.

:menu
echo Please select an option:
echo.
echo 1. Initialize Mock Candidate (Setup AI Interview)
echo 2. Start Interactive Conversation (Terminal Chat)
echo 3. Open Frontend in Browser
echo 4. Check Backend Health
echo 5. View Mock Candidate Data
echo 6. Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto init
if "%choice%"=="2" goto chat
if "%choice%"=="3" goto frontend
if "%choice%"=="4" goto health
if "%choice%"=="5" goto view
if "%choice%"=="6" goto end

echo Invalid choice! Please try again.
echo.
goto menu

:init
echo.
echo Initializing AI Interview with Mock Candidate...
echo.
cd backend
node test-mock-candidate.js
cd ..
echo.
pause
goto menu

:chat
echo.
echo Starting Interactive Conversation...
echo Type 'exit' to end the conversation
echo.
cd backend
node test-conversation.js
cd ..
echo.
pause
goto menu

:frontend
echo.
echo Opening Frontend in Browser...
echo URL: http://localhost:5174
echo.
start http://localhost:5174
echo.
echo Click the green "Load Sample Student Data" button
echo Then click "Start AI Interview"
echo.
pause
goto menu

:health
echo.
echo Checking Backend Health...
echo.
curl http://localhost:5000/api/health
echo.
echo.
pause
goto menu

:view
echo.
echo Mock Candidate Data:
echo.
type backend\mock-candidate.json
echo.
echo.
pause
goto menu

:end
echo.
echo Goodbye!
echo.
exit /b
