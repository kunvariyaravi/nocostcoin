@echo off
REM Secured 3-node MAINNET start (localhost API + auth token, faucet disabled by default)
setlocal
cd /d "%~dp0core"
set "RUST_LOG=info"
set "NOCOSTCOIN_API_BIND=127.0.0.1"
if "%NOCOSTCOIN_API_TOKEN%"=="" (
  echo WARNING: NOCOSTCOIN_API_TOKEN not set - write endpoints unauthenticated on localhost.
  echo Set it first:  set NOCOSTCOIN_API_TOKEN=your-long-random-secret
)
REM NOCOSTCOIN_ENABLE_FAUCET defaults to disabled. Set to 1 only for local testing.
echo Starting Node 1 (bootstrap)...
start "Nocostcoin-Mainnet-1" .\target\release\nocostcoin.exe --config ..\config\mainnet.toml
timeout /t 5 /nobreak >nul
echo Starting Node 2...
start "Nocostcoin-Mainnet-2" .\target\release\nocostcoin.exe --config ..\config\mainnet2.toml
timeout /t 3 /nobreak >nul
echo Starting Node 3...
start "Nocostcoin-Mainnet-3" .\target\release\nocostcoin.exe --config ..\config\mainnet3.toml
echo.
echo All 3 nodes starting (API on 127.0.0.1 only):
echo   http://127.0.0.1:8000/stats  http://127.0.0.1:8001/stats  http://127.0.0.1:8002/stats
echo   health: http://127.0.0.1:8000/health
pause
