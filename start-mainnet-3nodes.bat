@echo off
REM Start 3-node Nocostcoin MAINNET on this PC (chain-id 1)
REM Node1: P2P 9000 / API 8000 | Node2: P2P 9001 / API 8001 | Node3: P2P 9002 / API 8002
setlocal
cd /d "%~dp0core"
set "RUST_LOG=info"
echo Starting Node 1 (bootstrap)...
start "Nocostcoin-Mainnet-1" .\target\release\nocostcoin.exe --config ..\config\mainnet.toml
timeout /t 5 /nobreak >nul
echo Starting Node 2...
start "Nocostcoin-Mainnet-2" .\target\release\nocostcoin.exe --config ..\config\mainnet2.toml
timeout /t 3 /nobreak >nul
echo Starting Node 3...
start "Nocostcoin-Mainnet-3" .\target\release\nocostcoin.exe --config ..\config\mainnet3.toml
echo.
echo All 3 nodes starting. Check:
echo   Node1 API: http://127.0.0.1:8000/stats
echo   Node2 API: http://127.0.0.1:8001/stats
echo   Node3 API: http://127.0.0.1:8002/stats
pause
