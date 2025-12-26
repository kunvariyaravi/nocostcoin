# Quick Reference Card - Nocostcoin

## 🚀 Quick Start Commands

### Launch Testnet
```powershell
# Automated (Windows)
.\demo.ps1

# Or simple launch
.\launch_Testnet.ps1

# Linux/macOS
./launch_Testnet.sh
```

### Manual Node Launch
```bash
# Node 1 (Bootstrap)
cargo run --release -- --port 9000

# Node 2 (Peer)
cargo run --release -- --port 9001 --bootstrap /ip4/127.0.0.1/tcp/9000

# Node 3 (Peer)
cargo run --release -- --port 9002 --bootstrap /ip4/127.0.0.1/tcp/9000
```

## 💻 Interactive Commands

| Command | Description | Example |
|---------|-------------|---------|
| `info` | Show node status | `info` |
| `sim` | Toggle auto-transactions | `sim` |
| `send` | Send tokens | `send random 100` |
| `help` | Show commands | `help` |

## 📊 Monitoring

```powershell
# Check node status
.\check_nodes.ps1

# Monitor performance
.\monitor_performance.ps1
```

## 🔧 Troubleshooting

### Reset Testnet
```powershell
# Stop all nodes (Ctrl+C)
Remove-Item -Recurse nocostcoin_db_*
Remove-Item wallet_*.key
# Restart nodes
```

### Port Issues
```powershell
# Find process on port
Get-NetTCPConnection -LocalPort 9000

# Kill process
Stop-Process -Id <PID>
```

## 📈 Key Metrics

- **Block Time**: 2 seconds
- **Throughput**: 50 tx/s (100 tx/block)
- **Consensus**: Proof of Determinism
- **Min Stake**: 0.1% of total
- **Fallback Delay**: 1 second

## 🎯 Demo Talking Points

1. **Deterministic Consensus**
   - Round-robin leader selection
   - VRF verification for security
   - Predictable block production

2. **Performance**
   - 2-second blocks (consistent)
   - Fast synchronization
   - Low resource usage

3. **Security**
   - VRF threshold validation
   - Equivocation detection
   - Stake-weighted selection

4. **Developer Experience**
   - One-command Testnet
   - Interactive CLI
   - Comprehensive docs

## 🌟 Unique Selling Points

✅ **Deterministic** - Predictable block times  
✅ **Efficient** - No mining, low energy  
✅ **Secure** - VRF-based verification  
✅ **Fast** - 2-second finality  
✅ **Simple** - Easy to understand & deploy  

## 📱 Social Media Snippets

**Twitter Bio:**
"Blockchain with Proof of Determinism consensus. 2s blocks, VRF verification, built in Rust. Testnet-ready! 🦀⛓️"

**One-liner:**
"Nocostcoin: A deterministic blockchain with VRF-based consensus, achieving 2-second block times without mining."

**Elevator Pitch:**
"Instead of energy-intensive mining or complex PoS, Nocostcoin uses deterministic leader scheduling with cryptographic verification. Fast, efficient, and predictable."

## 🎥 Demo Script (30 seconds)

1. Run `.\demo.ps1` (5s)
2. Show 3 nodes launching (5s)
3. Type `info` in node 1 (5s)
4. Type `sim` to enable transactions (5s)
5. Show blocks being produced (10s)

**Narration:**
"With one command, we launch a 3-node blockchain. Each node produces blocks every 2 seconds in a deterministic round-robin. Transactions propagate instantly. That's Proof of Determinism."

## 📧 Contact Template

```
Subject: Nocostcoin - Proof of Determinism Blockchain

Hi [Name],

I've developed Nocostcoin, a blockchain using a novel "Proof of 
Determinism" consensus mechanism. It achieves:

• 2-second block times
• Deterministic leader selection
• VRF-based security
• One-command Testnet

Would love your feedback!

GitHub: [link]
Demo: [link]

Best,
[Your Name]
```

---

**Print this card for quick reference during demos!**

