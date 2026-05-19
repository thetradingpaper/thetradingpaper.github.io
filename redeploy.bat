@echo off
chcp 65001 >nul
title The Trading Paper - Redeploy
cd /d "%~dp0"

echo ===========================================
echo  The Trading Paper - Redeploy
echo ===========================================
echo.

if exist ".git" (
  echo [1/7] Removing old .git folder...
  rmdir /s /q ".git"
)

echo [2/7] Initializing fresh git repo...
git init -b main
if errorlevel 1 goto :gitfail

echo [3/7] Configuring git identity (local to this repo)...
git config user.email "lasha.pkhakadze2000@gmail.com"
git config user.name "thetradingpaper"
git config core.autocrlf true

echo [4/7] Adding remote origin...
git remote add origin https://github.com/thetradingpaper/thetradingpaper.github.io.git

echo [5/7] Fetching remote history...
git fetch origin main
if errorlevel 1 goto :authfail

echo [6/7] Aligning local main with remote, keeping your files...
git checkout -B main origin/main
git reset --mixed origin/main

echo.
echo Changed files:
git status --short
echo.

git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Daily upgrade 2026-05-18: market snapshot, edition 02, strategy, history, live prices"
  if errorlevel 1 goto :commitfail
  echo.
  echo [7/7] Pushing to GitHub...
  git push -u origin main
  if errorlevel 1 goto :authfail
) else (
  echo No changes to commit.
)

echo.
echo ===========================================
echo  Done. Site refreshes in 1-2 minutes:
echo  https://thetradingpaper.github.io/
echo ===========================================
pause
exit /b 0

:gitfail
echo ERROR: git init failed. Is Git installed and on PATH?
pause
exit /b 1

:commitfail
echo ERROR: commit failed.
pause
exit /b 1

:authfail
echo.
echo ERROR: GitHub auth failed.
echo If credential window appeared, sign in and run again.
echo Or use a Personal Access Token with "Contents: Read and write".
echo From: https://github.com/settings/tokens
pause
exit /b 1
