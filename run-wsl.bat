@echo off
REM Windows batch script to run Laravel Code Improver via WSL
REM Usage: run-wsl.bat <path-to-laravel-project>

setlocal enabledelayedexpansion

echo Laravel Code Improver - WSL Launcher
echo ====================================
echo.

if "%1"=="" (
    echo Error: Laravel project path is required
    echo.
    echo Usage: run-wsl.bat ^<path-to-laravel-project^>
    echo.
    echo Examples:
    echo   run-wsl.bat "C:\path\to\laravel\project"
    echo   run-wsl.bat "~\my-laravel-project"
    echo   run-wsl.bat /var/www/project
    exit /b 1
)

set LARAVEL_PATH=%~1
set PROJECT_DIR=%~dp0

echo Project path: %PROJECT_DIR%
echo Target Laravel: %LARAVEL_PATH%
echo.

REM Convert Windows path to WSL path if needed
echo Converting path for WSL...
set "WSL_PATH=%LARAVEL_PATH%"

REM Replace backslashes with forward slashes
set "WSL_PATH=!WSL_PATH:\=/!"

REM Replace C: with /mnt/c
set "WSL_PATH=!WSL_PATH:C:=/mnt/c!"
set "WSL_PATH=!WSL_PATH:c:=/mnt/c!"

REM Replace D: with /mnt/d
set "WSL_PATH=!WSL_PATH:D:=/mnt/d!"
set "WSL_PATH=!WSL_PATH:d:=/mnt/d!"

echo WSL path: %WSL_PATH%
echo.

REM Get the project directory in WSL format
set "PROJECT_WSL_PATH=%PROJECT_DIR%"
set "PROJECT_WSL_PATH=!PROJECT_WSL_PATH:\=/!"
set "PROJECT_WSL_PATH=!PROJECT_WSL_PATH:C:=/mnt/c!"
set "PROJECT_WSL_PATH=!PROJECT_WSL_PATH:c:=/mnt/c!"

echo Running analysis in WSL...
echo.

REM Run via WSL
wsl bash "%PROJECT_WSL_PATH%wsl-entry.sh" "%WSL_PATH%"

if errorlevel 1 (
    echo.
    echo Error: Analysis failed
    pause
    exit /b 1
)

echo.
echo Done!
pause

