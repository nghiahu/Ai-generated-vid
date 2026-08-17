@echo off
echo ================================================
echo    AI Video Creator - Build Electron App (Windows)
echo ================================================
echo.

cd /d "%~dp0"
node build.js --dir
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Build failed! Please check the logs above.
    pause
    exit /b 1
)

pause
