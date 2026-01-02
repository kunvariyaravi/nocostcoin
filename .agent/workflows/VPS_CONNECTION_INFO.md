# NocostCoin VPS Connection Information

## 🚀 Hostinger VPS (Live)
**Status:** 🟢 Online
**Public IP:** `72.62.167.94`
**SSH User:** `root`
**SSH Key:** `nocostcoin` (Managed by user)

### Quick Connect
```powershell
ssh -i "C:\Users\DELL\Downloads\ssh-key-2025-12-31.key" root@72.62.167.94
```

### Access Points
- **Node API**: [http://72.62.167.94:3000/api/node/info](http://72.62.167.94:3000/api/node/info)
- **Web UI**: [http://72.62.167.94:3001](http://72.62.167.94:3001)
- **P2P Network**: `72.62.167.94:8080`

### Useful Commands
```bash
# View Node Logs
cd ~/deployment/nocostcoin
docker compose logs -f

# Restart Node
docker compose restart

# Check Resources
htop
```

---

## 🗑️ Oracle Cloud (Deprecated)
**Status:** 🔴 Abandoned (OOM Issues)
**IP:** `80.225.208.120`
