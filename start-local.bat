@echo off
REM Start Nocostcoin single node locally (no VPS needed)
REM Run this file by double-clicking, or: start-local.bat
setlocal
set "CMAKE_BIN=C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin"
set "PATH=%CMAKE_BIN%;C:\Program Files\LLVM\bin;%PATH%"
set "LIBCLANG_PATH=C:\Program Files\LLVM\bin"
cd /d "%~dp0core"
echo Starting Nocostcoin local node (P2P 9000, API 8000, metrics 9090)...
echo Config: ..\config\nocostcoin.toml
cargo run --release -- --config ..\config\nocostcoin.toml
pause
