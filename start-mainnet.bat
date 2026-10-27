@echo off
REM Start Nocostcoin MAINNET node on this PC (no VPS)
setlocal
cd /d "%~dp0core"
echo Starting Nocostcoin MAINNET (chain-id 1, P2P 9000, API 8000)...
echo Config: ..\config\mainnet.toml
set "RUST_LOG=info"
.\target\release\nocostcoin.exe --config ..\config\mainnet.toml
pause
