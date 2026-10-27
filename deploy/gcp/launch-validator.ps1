# Nocostcoin GCP validator launcher - run from Windows PowerShell.
# Creates the VM, opens the firewall, then runs deploy/gcp/setup-validator.sh on it.
#
#   .\deploy\gcp\launch-validator.ps1 -Project my-gcp-project -Domain api.example.com
#
# Defaults target the Always Free tier: an e2-micro in us-central1 on a 30 GB
# standard disk costs nothing. Pass -Image to pull a Cloud Build image instead
# of building RocksDB on the VM (the micro only has 1 GB of RAM):
#
#   gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT/nocostcoin/node:v1 `
#     --machine-type=e2-highcpu-8 --timeout=3600s ./core
#   .\deploy\gcp\launch-validator.ps1 -Project PROJECT `
#     -Image us-central1-docker.pkg.dev/PROJECT/nocostcoin/node:v1
param(
  [string]$Project = "YOUR_PROJECT_ID",
  [string]$Zone = "us-central1-a",
  [string]$VM = "nocostcoin-validator",
  [string]$Domain = "",
  [string]$ApiToken = "",
  [string]$Image = "",
  [string]$MachineType = "e2-micro",
  [string]$DiskSize = "30GB",
  [string]$DiskType = "pd-standard",
  [string]$Mode = "setup",        # setup | identity | restart
  [switch]$Recreate
)

$ErrorActionPreference = "Stop"
$Region = $Zone -replace "-[a-z]$", ""

# 1. Install gcloud if missing
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Google Cloud CLI via winget..."
  winget install Google.CloudSDK --accept-source-agreements --accept-package-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
  if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "gcloud is still not on PATH. Restart this terminal and re-run."
    exit 1
  }
}

# 2. Auth + config
gcloud auth login
gcloud config set project $Project
gcloud config set compute/zone $Zone

# 3. VM
$tag = "nocostcoin-validator"
if ($Recreate) {
  Write-Host "Deleting existing instance $VM ..."
  gcloud compute instances delete $VM --zone $Zone --quiet 2>$null
}

if (-not (gcloud compute instances describe $VM --zone $Zone 2>$null)) {
  gcloud compute instances create $VM `
    --machine-type=$MachineType `
    --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud `
    --boot-disk-size=$DiskSize --boot-disk-type=$DiskType `
    --tags=$tag `
    --scopes=cloud-platform
}

# 4. Static external IP so the published bootstrap multiaddr stays valid.
gcloud compute addresses describe nocostcoin-ip --region $Region > $null 2>&1
if ($LASTEXITCODE -ne 0) {
  gcloud compute addresses create nocostcoin-ip --region $Region
}
gcloud compute instances add-access-config $VM --zone $Zone --address nocostcoin-ip 2>$null

# 5. Firewall: ssh, http/s and p2p. The API port (8000) stays closed - it is
#    only reachable through nginx.
gcloud compute firewall-rules describe nocostcoin-allow > $null 2>&1
if ($LASTEXITCODE -ne 0) {
  gcloud compute firewall-rules create nocostcoin-allow `
    --allow=tcp:22,tcp:80,tcp:443,tcp:9000 `
    --target-tags=$tag `
    --description="ssh, http/s, p2p"
}

$IP = gcloud compute instances describe $VM --zone $Zone --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
Write-Host ""
Write-Host "VM external IP: $IP"
if ($Domain) {
  Write-Host "Point the DNS A record for $Domain -> $IP"
}
Write-Host ""

# 6. Copy the setup script and run it
gcloud compute scp deploy/gcp/setup-validator.sh ${VM}:~/setup-validator.sh --zone $Zone

$envVars = "MODE=$Mode"
if ($Domain)   { $envVars += " DOMAIN=$Domain" }
if ($ApiToken) { $envVars += " NOCOSTCOIN_API_TOKEN=$ApiToken" }
if ($Image)    { $envVars += " NOCOSTCOIN_IMAGE=$Image" }

# The sed strips any CRLF that Windows may have introduced - a shell script with
# CRLF line endings fails on Linux with "bad interpreter".
gcloud compute ssh ${VM} --zone $Zone --command "sed -i 's/\r$//' ~/setup-validator.sh && chmod +x ~/setup-validator.sh && $envVars bash ~/setup-validator.sh"
