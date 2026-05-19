@echo off
chcp 65001 >nul
title The Trading Paper - Deploy
cd /d "%~dp0"

echo ===========================================
echo  The Trading Paper - GitHub Pages Deploy
echo ===========================================
echo.

REM ----- Step 1: Ensure remote configured -----
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo [1/5] Adding remote origin...
  git remote add origin https://github.com/thetradingpaper/thetradingpaper.github.io.git
) else (
  echo [1/5] Remote already configured:
  git remote get-url origin
)
echo.

REM ----- Step 2: Fetch latest from remote -----
echo [2/5] Fetching from GitHub...
git fetch origin main
if errorlevel 1 (
  echo.
  echo ERROR: fetch failed. Check your internet connection.
  echo If asked for credentials: use your GitHub username + Personal Access Token.
  echo Get token at: https://github.com/settings/tokens  (scope: repo)
  echo.
  pause
  exit /b 1
)
echo.

REM ----- Step 3: Sync local main branch with remote (preserve working files) -----
echo [3/5] Syncing local main branch with remote history...
git checkout -B main origin/main 2>nul
git reset --mixed origin/main
echo.

REM ----- Step 4: Stage all current files -----
echo [4/5] Staging changes...
git add -A
echo.
echo Changed files:
git status --short
echo.

REM ----- Step 5: Commit and push -----
set "MSG=update - strategy page + live valuation books on homepage"
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "%MSG%"
  echo.
  echo [5/5] Pushing to GitHub...
  git push -u origin main
  if errorlevel 1 (
    echo.
    echo ERROR: push failed.
    echo If asked for credentials:
    echo   Username: your GitHub username ^(probably 'thetradingpaper'^)
    echo   Password: Personal Access Token from github.com/settings/tokens
    echo.
    pause
    exit /b 1
  )
) else (
  echo No changes to commit. Working tree clean.
)

echo.
echo ===========================================
echo  Done! Site will refresh in 1-2 minutes:
echo  https://thetradingpaper.github.io/
echo ===========================================
echo.
pause
