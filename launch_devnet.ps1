Write-Host "🚀 Launching Nocostcoin Devnet..." -ForegroundColor Cyan

# 1. Build the Rust Project
Write-Host "🔨 Building Nocostcoin Node..." -ForegroundColor Yellow
Push-Location core
cargo build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    Pop-Location
    exit
}
Pop-Location

# 2. Launch Bootnode (Port 9000)
Write-Host "🌱 Starting Bootnode (Port 9000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd core; cargo run -- --port 9000"

# Wait for bootnode to come up
Start-Sleep -Seconds 5

# 3. Launch Peer 1 (Port 9001)
Write-Host "🔗 Starting Peer 1 (Port 9001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd core; cargo run -- --port 9001 --bootstrap /ip4/127.0.0.1/tcp/9000"

# 4. Launch Peer 2 (Port 9002)
Write-Host "🔗 Starting Peer 2 (Port 9002)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd core; cargo run -- --port 9002 --bootstrap /ip4/127.0.0.1/tcp/9000"

# 5. Launch Website
Write-Host "🌐 Starting Website..." -ForegroundColor Blue
Set-Location ui
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait for website
Start-Sleep -Seconds 5

# 6. Open Browser
Write-Host "👀 Opening Dashboard..." -ForegroundColor Magenta
Start-Process "http://localhost:3000/dashboard"

Write-Host "✅ Devnet Launched Successfully!" -ForegroundColor Cyan
Write-Host "   - API 1: http://localhost:8000"
Write-Host "   - API 2: http://localhost:8001"
Write-Host "   - API 3: http://localhost:8002"
Write-Host "   - Web:   http://localhost:3000"
