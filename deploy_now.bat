@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo === Trading Paper deploy ===

REM Clean stale locks
if exist ".git\index.lock" del /f /q ".git\index.lock"
if exist ".git\objects\maintenance.lock" del /f /q ".git\objects\maintenance.lock"

git config user.email "lasha.pkhakadze2000@gmail.com"
git config user.name "thetradingpaper"

REM Sync with remote first (we're behind by a few commits)
git fetch origin main
git reset --mixed origin/main

REM Stage + commit + push
git add -A
git commit -m "BOG portfolio update 2026-05-19: add QBTS, top up ASX, live Yahoo prices with pre/post-market"
git push origin main

echo === DONE ===
exit /b 0
