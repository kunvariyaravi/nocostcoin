# Nocostcoin Devnet Launch Guide

## Quick Start

### 1. Build the Project
```powershell
cargo build --release
```

### 2. Launch Multi-Node Devnet

**Terminal 1 - Bootstrap Node (Port 9000):**
```powershell
cargo run --release -- --port 9000
```

**Terminal 2 - Validator Node (Port 9001):**
```powershell
cargo run --release -- --port 9001 --bootstrap /ip4/127.0.0.1/tcp/9000
```

**Terminal 3 - Validator Node (Port 9002):**
```powershell
cargo run --release -- --port 9002 --bootstrap /ip4/127.0.0.1/tcp/9000
```

## Node Configuration

### Command-Line Options
- `--port <PORT>` - Set the listening port (default: 9000)
- `--bootstrap <MULTIADDR>` - Connect to a bootstrap node

### Example Multi-Address Formats
- Local: `/ip4/127.0.0.1/tcp/9000`
- Remote: `/ip4/192.168.1.100/tcp/9000`

## Interactive Commands

Once a node is running, you can use these commands:

| Command | Description |
|---------|-------------|
| `info` | Display node status (height, balance, mempool, etc.) |
| `help` | Show available commands |
| `sim` | Toggle automatic transaction generation |
| `send <address> <amount>` | Send tokens to an address |
| `send random <amount>` | Send tokens to a random address |

### Example Usage
```
info                                    # Check node status
sim                                     # Enable auto-transactions
send random 100                         # Send 100 tokens to random address
send a1b2c3... 50                      # Send 50 tokens to specific address
```

## Devnet Features

### Automatic Setup
- ✅ **Genesis Block**: Created automatically on first run
- ✅ **Wallet**: Generated and saved per node (`wallet_<port>.key`)
- ✅ **Database**: Separate DB per node (`nocostcoin_db_<port>`)
- ✅ **Initial Balance**: Each node starts with 1,000,000 tokens
- ✅ **Validator Registration**: Nodes auto-register as validators

### Network Features
- **Peer Discovery**: Automatic via mDNS (local network)
- **Gossipsub**: Block and transaction propagation
- **Kademlia DHT**: Decentralized peer routing
- **Chain Sync**: Automatic synchronization with peers

### Consensus
- **Slot Duration**: 2 seconds
- **Epoch Duration**: 1 hour (1800 slots)
- **Leader Selection**: Deterministic round-robin with VRF
- **Fallback**: Backup validators (1 second delay)
- **Minimum Stake**: 0.1% of total stake required

## Monitoring Your Devnet

### Check Node Status
```powershell
.\check_nodes.ps1
```

This shows:
- Running processes
- Listening ports
- Quick status overview

### Monitor Performance
```powershell
.\monitor_performance.ps1
```

This displays:
- Block production rate
- Transaction throughput
- Network activity

### What to Look For

**Successful Devnet Indicators:**
1. ✅ "Peer connected" messages between nodes
2. ✅ "Processing Slot" messages every 2 seconds
3. ✅ "Produced and added block" messages
4. ✅ "Received block from network" messages
5. ✅ Chain height increasing on all nodes

**Common Issues:**
- ⚠️ "Failed to add block" - Check VRF threshold or validator registration
- ⚠️ "Rejected received block" - Check consensus validation
- ⚠️ No peer connections - Check bootstrap address

## Devnet Scenarios

### Scenario 1: Testing Block Production
```powershell
# Terminal 1
cargo run --release -- --port 9000

# Wait for blocks to be produced
# Type: info
# You should see height increasing
```

### Scenario 2: Multi-Node Network
```powershell
# Terminal 1 (Bootstrap)
cargo run --release -- --port 9000

# Terminal 2 (Peer)
cargo run --release -- --port 9001 --bootstrap /ip4/127.0.0.1/tcp/9000

# Terminal 3 (Peer)
cargo run --release -- --port 9002 --bootstrap /ip4/127.0.0.1/tcp/9000

# All nodes should sync and produce blocks in round-robin
```

### Scenario 3: Transaction Testing
```powershell
# In any node terminal:
sim                    # Enable auto-transactions
info                   # Check mempool size
# Watch blocks include transactions
```

### Scenario 4: Chain Synchronization
```powershell
# Start node 1, let it produce blocks
cargo run --release -- --port 9000

# Wait 30 seconds, then start node 2
cargo run --release -- --port 9001 --bootstrap /ip4/127.0.0.1/tcp/9000

# Node 2 should sync all blocks from node 1
# Look for "Sync started", "Sync progress", "Sync completed" messages
```

## Devnet Configuration

### Genesis Parameters
- **Genesis Time**: Set to current time on first launch
- **Initial Supply**: 1,000,000 tokens per node
- **Validator Stake**: 1,000,000 (100% of initial balance)

### Network Parameters
- **Mempool Size**: 1,000 transactions
- **Block Size**: 100 transactions per block
- **Sync Batch**: 100 blocks per request

### Consensus Parameters
- **Slot Duration**: 2000ms (2 seconds)
- **Slots Per Epoch**: 1800 (1 hour)
- **Fallback Delay**: 1000ms (1 second)
- **Min Stake Ratio**: 0.001 (0.1%)

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port
Get-NetTCPConnection -LocalPort 9000

# Kill process
Stop-Process -Id <PID>
```

### Reset Devnet
```powershell
# Stop all nodes (Ctrl+C in each terminal)

# Delete databases
Remove-Item -Recurse nocostcoin_db_*

# Delete wallets (optional - creates new validators)
Remove-Item wallet_*.key

# Restart nodes
```

### Database Corruption
```powershell
# Stop node
# Delete specific database
Remove-Item -Recurse nocostcoin_db_9000

# Restart node (will resync from peers)
```

## Production Considerations

Before moving to production, implement:

1. **Transaction Fees** - Prevent spam (currently disabled per your request)
2. **Rate Limiting** - Network DoS protection
3. **Block Size Limits** - Prevent large block attacks
4. **Finality Mechanism** - Prevent long-range attacks
5. **Peer Reputation** - Ban malicious peers
6. **Time Synchronization** - NTP integration
7. **Monitoring & Metrics** - Prometheus/Grafana
8. **Backup & Recovery** - Database snapshots

## Current Security Status

**Security Rating**: 68/100 (after VRF threshold fix)

**Safe for Devnet**: ✅ Yes  
**Production Ready**: ❌ No

**Known Limitations**:
- No transaction fees (spam possible)
- No rate limiting (DoS possible)
- No block size limits
- System time dependency
- No finality mechanism

These are acceptable for devnet testing but must be addressed for production.

## Support

For issues or questions:
1. Check the logs in each terminal
2. Run `.\check_nodes.ps1` for status
3. Use `info` command in node terminal
4. Review this guide's troubleshooting section

Happy testing! 🚀
