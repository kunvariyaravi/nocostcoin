# Nocostcoin Testnet Launch Guide

Complete instructions for running a 3-node local testnet with the Next.js UI.

---

## Prerequisites

### Required Software

**All Platforms:**
- Rust 1.70+ ([Install](https://rustup.rs/))
- Node.js 18+ ([Install](https://nodejs.org/))

**Windows Only:**
- LLVM/Clang (Required for RocksDB compilation)

### Installing LLVM on Windows

RocksDB requires LLVM for compilation on Windows. Install it with:

```powershell
winget install LLVM.LLVM
```

Or download manually from: https://releases.llvm.org/download.html

**Verify Installation:**
```powershell
Test-Path "C:\Program Files\LLVM\bin\libclang.dll"
# Should return: True
```

---

## Quick Start

### 1. Clone and Build

```bash
git clone https://github.com/yourusername/nocostcoin.git
cd nocostcoin
```

**Windows:**
```powershell
# Set LLVM path for RocksDB
$env:LIBCLANG_PATH="C:\Program Files\LLVM\bin"

# Build core
cd core
cargo build --release
cd ..

# Build UI
cd ui
npm install
cd ..
```

**Linux/macOS:**
```bash
# Build core
cd core
cargo build --release
cd ..

# Build UI
cd ui
npm install
cd ..
```

---

## Launch the Testnet

You'll need **4 terminal windows**: 3 for blockchain nodes and 1 for the UI.

### Terminal 1: Bootstrap Node (Port 9000)

**Windows:**
```powershell
$env:LIBCLANG_PATH="C:\Program Files\LLVM\bin"
cd core
cargo run --release -- --port 9000
```

**Linux/macOS:**
```bash
cd core
cargo run --release -- --port 9000
```

**Expected Output:**
```
Config file not found, using default Devnet config for port 9000
API server starting on http://0.0.0.0:8000
Metrics exporter listening on port 9090
Processing Slot: 1
🎰 Won Secret Leader Election for slot 1
Produced and added block for slot 1: abc123... with 0 txs
```

### Terminal 2: Validator Node (Port 9001)

**Windows:**
```powershell
$env:LIBCLANG_PATH="C:\Program Files\LLVM\bin"
cd core
cargo run --release -- --port 9001 --bootstrap "/ip4/127.0.0.1/tcp/9000"
```

**Linux/macOS:**
```bash
cd core
cargo run --release -- --port 9001 --bootstrap "/ip4/127.0.0.1/tcp/9000"
```

**Expected Output:**
```
Peer connected: 12D3KooW... Requesting chain info...
Peer 12D3KooW... has height 5
Syncing...
✓ Accepted block from network for slot 6
```

### Terminal 3: Validator Node (Port 9002)

**Windows:**
```powershell
$env:LIBCLANG_PATH="C:\Program Files\LLVM\bin"
cd core
cargo run --release -- --port 9002 --bootstrap "/ip4/127.0.0.1/tcp/9000"
```

**Linux/macOS:**
```bash
cd core
cargo run --release -- --port 9002 --bootstrap "/ip4/127.0.0.1/tcp/9000"
```

### Terminal 4: UI Dashboard

```bash
cd ui
npm run dev
```

**Access the UI at:** http://localhost:3000

---

## Testnet Access Points

Once all nodes and the UI are running:

| Service | URL | Description |
|---------|-----|-------------|
| **UI Dashboard** | http://localhost:3000 | Web interface |
| **Explorer** | http://localhost:3000/testnet/explorer | Block explorer |
| **Wallet** | http://localhost:3000/testnet/wallet | Your wallet |
| **Network** | http://localhost:3000/testnet/network | Peer status |
| **Mempool** | http://localhost:3000/testnet/mempool | Pending txs |
| **API - Node 1** | http://localhost:8000 | REST API |
| **API - Node 2** | http://localhost:8001 | REST API |
| **API - Node 3** | http://localhost:8002 | REST API |
| **Metrics - Node 1** | http://localhost:9090/metrics | Prometheus |
| **Metrics - Node 2** | http://localhost:9091/metrics | Prometheus |
| **Metrics - Node 3** | http://localhost:9092/metrics | Prometheus |

---

## Using the UI

### 1. Dashboard
- View real-time network statistics
- See latest blocks
- Monitor validator status
- Send/receive tokens
- Use the faucet to get test tokens

### 2. Wallet
- Your address is auto-generated on first visit
- Check balance and transaction history
- Copy your address
- View incoming/outgoing transactions

### 3. Explorer
- Browse all blocks
- Click on any block to see details
- View transactions in blocks
- Search by block hash or slot number

### 4. Faucet
- Click "Request 1,000 NCC" on the Dashboard
- Rate limited to once per 24 hours per address
- Instant distribution when available

---

## Command-Line Options

### Core Node Arguments

```bash
cargo run --release -- [OPTIONS]
```

| Option | Description | Example |
|--------|-------------|---------|
| `--port <PORT>` | P2P listening port | `--port 9000` |
| `--bootstrap <ADDR>` | Bootstrap peer address | `--bootstrap "/ip4/127.0.0.1/tcp/9000"` |
| `--mining <BOOL>` | Enable/disable mining | `--mining false` |
| `--config <PATH>` | Config file path | `--config config/node1.toml` |

### Bootstrap Address Format

```
/ip4/<IP>/tcp/<PORT>
```

**Examples:**
- Local: `/ip4/127.0.0.1/tcp/9000`
- LAN: `/ip4/192.168.1.100/tcp/9000`
- Public: `/ip4/203.0.113.10/tcp/9000`

---

## Network Configuration

### Automatic Setup
Each node automatically:
- ✅ Creates a genesis block (if first node)
- ✅ Generates and saves a wallet keypair
- ✅ Sets up a RocksDB database
- ✅ Initializes with 1,000,000 NCC balance
- ✅ Registers as a validator with full stake

### Data Storage

**Per-Node Files:**
- `nocostcoin_db_<port>/` - RocksDB database
- `wallet_<port>.key` - Private key (keep secret!)
- `config/nocostcoin.toml` - Configuration (optional)

### Consensus Parameters

- **Slot Duration**: 2 seconds
- **Block Time**: ~2 seconds average
- **Epoch Duration**: 1 hour (1800 slots)
- **Transactions per Block**: Up to 100
- **Mempool Size**: 1,000 transactions
- **Fallback Delay**: 1 second
- **Min Validator Stake**: 0.1% of total stake (1,000 NCC minimum)

---

## Monitoring Your Testnet

### Success Indicators

Look for these in the node terminals:

```
✅ Peer connected: <PeerID>
✅ Processing Slot: <N>
✅ 🎰 Won Secret Leader Election for slot <N>
✅ Produced and added block for slot <N>
✅ Received block from network
✅ ✓ Accepted block from network for slot <N>
```

### Health Checks

**Check API:**
```powershell
# Node status
curl http://localhost:8000/stats

# Chain info
curl http://localhost:8000/chain

# Peer list
curl http://localhost:8000/peers
```

**Check Metrics:**
```powershell
curl http://localhost:9090/metrics | Select-String "block_height"
```

---

## Common Issues & Solutions

### Issue: "LLVM not found" (Windows)

**Symptoms:**
```
Unable to find libclang: couldn't find any valid shared libraries
```

**Solution:**
1. Install LLVM: `winget install LLVM.LLVM`
2. Set environment variable:
   ```powershell
   $env:LIBCLANG_PATH="C:\Program Files\LLVM\bin"
   ```
3. Rebuild: `cargo clean && cargo build --release`

### Issue: "Port already in use"

**Symptoms:**
```
Error: Address already in use
```

**Solution:**

**Windows:**
```powershell
# Find process using port
Get-NetTCPConnection -LocalPort 9000

# Kill process
Stop-Process -Id <PID>
```

**Linux/macOS:**
```bash
lsof -ti:9000 | xargs kill -9
```

### Issue: Nodes not connecting

**Symptoms:**
- No "Peer connected" messages
- Chain height not increasing on peer nodes

**Solutions:**
1. **Check bootstrap address**: Ensure it matches the first node's IP and port
2. **Verify network**: Make sure nodes can reach each other (firewall/NAT)
3. **Check logs**: Look for connection errors in terminal output

### Issue: "Failed to add block"

**Symptoms:**
```
Failed to add block: VRF threshold not met
```

**Solutions:**
- This is normal! Not every validator wins every slot
- If persistent, check validator stake meets minimum (0.1%)

### Issue: UI not loading data

**Symptoms:**
- Dashboard shows "Loading..."
- Explorer is empty

**Solutions:**
1. **Check API is running**: Visit http://localhost:8000/stats
2. **Check CORS**: API should allow localhost:3000
3. **Clear browser cache**: Hard refresh (Ctrl+F5)
4. **Check browser console**: Look for fetch errors

---

## Resetting the Testnet

### Complete Reset

Stop all nodes and UI (Ctrl+C), then:

**Windows:**
```powershell
# Delete all databases
Remove-Item -Recurse -Force nocostcoin_db_*

# Delete all wallets (creates new validators)
Remove-Item wallet_*.key

# Restart nodes from scratch
```

**Linux/macOS:**
```bash
rm -rf nocostcoin_db_*
rm wallet_*.key
```

### Single Node Reset

```powershell
# Stop the node (Ctrl+C)

# Delete only that node's database
Remove-Item -Recurse -Force nocostcoin_db_9001

# Restart the node (will resync from peers)
```

---

## Testing Scenarios

### Scenario 1: Basic Block Production

```powershell
# Launch single node
cargo run --release -- --port 9000

# Watch terminal for:
# - "Processing Slot" every 2 seconds
# - "Produced and added block" periodically
#
# Check UI:
# - Dashboard shows increasing block height
# - Explorer displays blocks
```

### Scenario 2: Multi-Node Consensus

```powershell
# Launch 3 nodes as described above

# All terminals should show:
# - Peer connection messages
# - Block production from different nodes
# - "Received block from network" messages
#
# Check UI:
# - Network page shows 2 connected peers
# - Explorer shows blocks from multiple validators
```

### Scenario 3: Faucet Test

```powershell
# Launch testnet
# Open UI at localhost:3000

# Steps:
# 1. Go to Dashboard
# 2. Click "Request 1,000 NCC"
# 3. Wait ~2 seconds for next block
# 4. Balance should increase by 1,000 NCC
#
# Try requesting again:
# - Should show "Please wait 24 hours" message
```

### Scenario 4: Transaction Test

```powershell
# In UI Wallet page:
# 1. Copy your address
# 2. Go to Dashboard
# 3. Send NCC to yourself
# 4. Check Wallet page for tx history
# 5. Check Explorer for the transaction
```

### Scenario 5: Node Failure Recovery

```powershell
# Start all 3 nodes
# Stop node on port 9001 (Ctrl+C)
# Observe:
# - Other nodes continue producing blocks
# - Network adapts to 2 validators
#
# Restart node 9001:
# - It should sync missing blocks
# - Resume normal operation
```

---

## Production Checklist

Before considering mainnet deployment, implement:

- [ ] **Transaction Fees** - Spam prevention
- [ ] **Rate Limiting** - DoS protection
- [ ] **Block Size Limits** - Resource management
- [ ] **Finality Mechanism** - BFT checkpointing
- [ ] **Peer Reputation** - Ban malicious nodes
- [ ] **Time Synchronization** - NTP integration
- [ ] **Monitoring & Alerting** - Grafana dashboards
- [ ] **Backup & Recovery** - Database snapshots
- [ ] **Security Audit** - Third-party review
- [ ] **Load Testing** - Performance under stress

---

## API Reference

### GET /stats
Returns node statistics.

**Response:**
```json
{
  "chain_height": 1234,
  "mempool_size": 5,
  "peer_count": 2,
  "address": "02abc123...",
  "balance": 1000000,
  "is_mining": true
}
```

### GET /chain
Returns chain information.

**Response:**
```json
{
  "height": 1234,
  "head_hash": "abc123...",
  "total_supply": 3000000
}
```

### POST /faucet
Request test tokens.

**Body:**
```json
{
  "address": "02abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "tx_hash": "def456...",
  "amount": 1000
}
```

### GET /account/:address
Get account information.

**Response:**
```json
{
  "balance": 5000,
  "nonce": 3,
  "stake": 1000000
}
```

### GET /blocks?limit=20
Get recent blocks.

**Response:**
```json
[
  {
    "hash": "abc123...",
    "header": {
      "slot": 100,
      "epoch": 0,
      "timestamp": 1703001234,
      "validator_pubkey": [...]
    },
    "transactions": []
  }
]
```

For full API documentation, see the Swagger UI at http://localhost:8000/docs (coming soon).

---

## Support

### Getting Help

1. **Check Logs**: Look for error messages in terminal output
2. **Review This Guide**: Most issues are covered in "Common Issues"
3. **GitHub Issues**: [Report bugs](https://github.com/yourusername/nocostcoin/issues)
4. **Discussions**: [Ask questions](https://github.com/yourusername/nocostcoin/discussions)

### Useful Commands

**Windows:**
```powershell
# Show running node processes
Get-Process | Where-Object {$_.ProcessName -like "*nocostcoin*"}

# Show ports in use
Get-NetTCPConnection | Where-Object {$_.LocalPort -ge 8000 -and $_.LocalPort -le 9100}

# View logs (if redirected)
Get-Content -Tail 50 -Wait node.log
```

**Linux/macOS:**
```bash
# Show running node processes
ps aux | grep nocostcoin

# Show ports in use
netstat -tuln | grep -E "8000|9000|9090"

# View logs
tail -f node.log
```

---

## Next Steps

Once your testnet is running smoothly:

1. **Explore the UI** - Test all features
2. **Read the Whitepaper** - Understand the consensus
3. **Review the Code** - Learn the implementation
4. **Build a dApp** - Create something on Nocostcoin
5. **Contribute** - Improve the project

Happy testing! 🚀

---

**Status**: ✅ Safe for Testnet | ⚠️ Not production-ready
