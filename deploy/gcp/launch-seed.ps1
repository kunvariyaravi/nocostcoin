# Nocostcoin GCP seed launcher — run from Windows PowerShell in C:\nocostcoin
# Creates 1x e2-medium seed VM + firewall, copies setup script, opens SSH.
# Prerequisites: a GCP project with billing enabled.
param(
  [string]$Project = "YOUR_PROJECT_ID",
  [string]$Zone = "us-central1-a",
  [string]$VM = "nocostcoin-seed",
  [string]$Domain = "YOUR_DOMAIN"
)

$ErrorActionPreference = "Stop"

# 1. Install gcloud if missing
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Google Cloud CLI via winget..."
  winget install Google.CloudSDK --accept-source-agreements --accept-package-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
  Write-Host "Restart this terminal if 'gcloud' is still not found, then re-run."
}

# 2. Auth + config
gcloud auth login
gcloud config set project $Project
gcloud config set compute/zone $Zone

# 3. VM (e2-medium = 2vCPU/4GB — minimum stable for RocksDB build + node + UI)
gcloud compute instances create $VM `
  --machine-type=e2-medium `
  --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud `
  --boot-disk-size=30GB --boot-disk-type=pd-balanced `
  --tags=nocostcoin-seed

# 4. Firewall (skip if rule exists)
gcloud compute firewall-rules create nocostcoin-allow `
  --allow=tcp:22,tcp:80,tcp:443,tcp:8000,tcp:9000 `
  --target-tags=nocostcoin-seed `
  --description="ssh, http/s, api, p2p" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "Firewall rule already exists, continuing..." }

$IP = gcloud compute instances describe $VM --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
Write-Host ""
Write-Host "VM external IP: $IP"
Write-Host "Next: point DNS A records @ and www ($Domain) -> $IP"
Write-Host ""
# 5. Copy setup script and SSH
gcloud compute scp deploy/gcp/setup-seed.sh ${VM}:~/setup-seed.sh --zone $Zone
gcloud compute ssh ${VM} --zone $Zone --command "chmod +x ~/setup-seed.sh && DOMAIN=$Domain bash ~/setup-seed.sh"
