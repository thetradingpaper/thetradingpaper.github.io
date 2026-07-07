@echo off
chcp 65001 >nul
cd /d "%~dp0"

if exist ".git\index.lock" del /f /q ".git\index.lock"

git add -A
git commit -m "Cleanup: dedupe CSS badge block and JS function blocks"
git push origin main

exit /b 0
