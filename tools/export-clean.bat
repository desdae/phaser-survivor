@echo off
rem Builds a clean copy of this project for sharing: no git history, CI folders, agent/AI notes,
rem planning docs, dependencies, build output, local env files or logs.
rem The repository itself is never changed.
rem
rem Usage: tools\export-clean.bat [output-dir]
rem   Default output-dir: .\export
rem   Result: <output-dir>\<project-name>\ and <output-dir>\<project-name>-clean.zip
setlocal

for %%I in ("%~dp0..") do set "ROOT=%%~fI"
for %%I in ("%ROOT%") do set "NAME=%%~nxI"
if "%~1"=="" (set "OUT=%ROOT%\export") else (set "OUT=%~f1")
set "DEST=%OUT%\%NAME%"
set "ZIP=%OUT%\%NAME%-clean.zip"

if not exist "%OUT%" mkdir "%OUT%"
if exist "%DEST%" rmdir /s /q "%DEST%"
if exist "%ZIP%" del /q "%ZIP%"

rem /XD with a full path skips only that folder; a bare name skips it at any depth.
robocopy "%ROOT%" "%DEST%" /E /NFL /NDL /NJH /NJS /NP ^
  /XD "%OUT%" "%ROOT%\docs" "%ROOT%\tools" "%ROOT%\export" ^
      .git .github .gitlab .circleci .claude .cursor .codex .aider .worktrees .vscode .idea ^
      node_modules dist coverage .vite .cache ^
  /XF CLAUDE.md AGENTS.md GEMINI.md .cursorrules .aider* .env .env.* *.log npm-debug.log* ^
      .DS_Store Thumbs.db *.pem *.key *.p12 .npmrc >nul
rem robocopy exit codes 0-7 mean success.
if errorlevel 8 (
  echo Copy failed.
  exit /b 1
)

rem Keep the example env file if the project has one.
if exist "%ROOT%\.env.example" copy /y "%ROOT%\.env.example" "%DEST%\.env.example" >nul

echo Checking for possible secrets or personal data...
findstr /S /I /N /R /C:"api_key" /C:"api-key" /C:"apikey" /C:"secret" /C:"password" /C:"passwd" /C:"token" /C:"PRIVATE KEY" /C:"[A-Za-z0-9._-]*@[A-Za-z0-9.-]*\.[a-z][a-z]" "%DEST%\*.js" "%DEST%\*.ts" "%DEST%\*.json" "%DEST%\*.md" "%DEST%\*.html" "%DEST%\*.css" "%DEST%\*.txt" 2>nul | findstr /V /I "package-lock.json"
if errorlevel 1 (
  echo No obvious secrets or email addresses found.
) else (
  echo WARNING: review the lines above before sharing.
)

powershell -NoProfile -Command "Compress-Archive -Path '%DEST%' -DestinationPath '%ZIP%' -Force"
if errorlevel 1 (
  echo Zip failed.
  exit /b 1
)

echo Clean copy: %DEST%
echo Zip:        %ZIP%
endlocal
