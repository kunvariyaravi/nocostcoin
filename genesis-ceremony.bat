@echo off
REM ============================================================================
REM Nocostcoin genesis ceremony - create a validator identity.
REM Run this ON THE VALIDATOR'S OWN MACHINE. The secret keys never leave it.
REM
REM Usage:  genesis-ceremony.bat [port]
REM   port   P2P port of this validator: 9000, 9001 or 9002 (default 9000)
REM
REM Prints:
REM   VALIDATOR_PUBKEY=<64 hex>  -> genesis.toml  initial_validators
REM   WALLET_ADDRESS=<64 hex>    -> genesis.toml  initial_funded_accounts
REM
REM Back up data\genesis\*.key offline as soon as this finishes.
REM ============================================================================
setlocal
set PORT=%1
if "%PORT%"=="" set PORT=9000

cd /d "%~dp0core"
if not exist "..\data\genesis" mkdir "..\data\genesis"

echo Generating validator identity for port %PORT% ...
echo Keys are written to %~dp0data\genesis and must never leave this machine.
echo.

if not exist "target\release\nocostcoin.exe" (
  echo ERROR: target\release\nocostcoin.exe not found.
  echo Build it first:  cd core ^&^& cargo build --release
  pause
  exit /b 1
)

.\target\release\nocostcoin.exe --config ..\config\ceremony.toml --port %PORT% --identity

echo.
echo DONE. Back up %~dp0data\genesis\*.key offline NOW.
echo Then paste the pubkey and wallet address into config\genesis.toml
echo   initial_validators    - the VALIDATOR_PUBKEY
echo   initial_funded_accounts - the WALLET_ADDRESS
echo and copy that [genesis] block identically into every node's config.
pause
