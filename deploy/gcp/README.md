# Running a Nocostcoin validator node on Google Cloud

Deploys the node to a GCP VM, publishes its HTTP API at
`https://api.nocostcoin.com` and lets the Vercel-hosted UI talk to it.

The website (`nocostcoin.com`) stays on Vercel - only the node runs on GCP.

## What runs where

```
browser ──> Vercel (nocostcoin.com)
                 │  Next.js route handler (server-side, holds the token)
                 ▼
           https://api.nocostcoin.com
                 │  nginx + TLS on the VM
                 ▼
           127.0.0.1:8000  node API (Docker)

other validators ──> <VM public IP>:9000  P2P
```

## Prerequisites

- A GCP project with billing enabled.
- `gcloud` on your machine (`winget install Google.CloudSDK`).
- A domain you control. For `nocostcoin.com`, add an **A record**
  `api.nocostcoin.com -> <VM IP>`.
- The repository pushed to GitHub (the VM clones it):
  `https://github.com/kunvariyaravi/nocostcoin.git`.

## 1. Create the VM and build the node

From the repo root, in PowerShell:

```powershell
.\deploy\gcp\launch-validator.ps1 `
  -Project YOUR_PROJECT_ID `
  -Domain api.nocostcoin.com `
  -ApiToken (Get-Random -MinimumLength 40)
```

This creates an `e2-standard-2` VM with a static IP, opens 22/80/443/9000 in the
firewall, installs Docker, clones the repo, builds the image and starts the node.

The node will not stay up yet: the genesis still contains the
`REPLACE_WITH_...` placeholders. That is deliberate - the node refuses to start
on a genesis that was never finalised.

## 2. The ceremony

Run this on the VM. It creates the validator key **on the VM** and prints the
public values you need:

```powershell
gcloud compute ssh nocostcoin-validator --command "MODE=identity bash ~/setup-validator.sh"
```

Output:

```
VALIDATOR_PUBKEY=<64 hex>
WALLET_ADDRESS=<64 hex>
```

Back up the key files on the VM now (`/opt/nocostcoin/nocostcoin/data/validator/`):
`validator_9000.key`, `wallet_9000.key`, `libp2p_identity.key`. They are the
node's identity - never commit or copy them anywhere.

Do this on **every** validator, then collect all three pubkeys.

## 3. Freeze the genesis

Paste the values into `config/genesis.toml`:

```toml
initial_validators = [
    "<validator 1 VALIDATOR_PUBKEY>",
    "<validator 2 VALIDATOR_PUBKEY>",
    "<validator 3 VALIDATOR_PUBKEY>",
]
initial_funded_accounts = [
    "<validator 1 WALLET_ADDRESS>",
    "<validator 2 WALLET_ADDRESS>",
    "<validator 3 WALLET_ADDRESS>",
]
```

Copy the same `[genesis]` block into `config/mainnet.toml`, `config/mainnet2.toml`,
`config/mainnet3.toml` and `config/mainnet-gcp.toml`. A test in the Rust crate
(`config::tests::test_mainnet_configs_share_one_genesis`) fails if they drift.

Then push it:

```powershell
git add config/ && git commit -m "Freeze mainnet genesis" && git push
```

## 4. Start the chain

```powershell
gcloud compute ssh nocostcoin-validator --command "MODE=restart bash ~/setup-validator.sh"
```

Check it:

```powershell
gcloud compute ssh nocostcoin-validator --command "curl -s http://127.0.0.1:8000/health; curl -s http://127.0.0.1:8000/stats"
```

The PeerId is printed in the logs. It is stable across restarts because the
libp2p identity is persisted - publish it so other validators can bootstrap:

```
/ip4/<VM PUBLIC IP>/tcp/9000/p2p/<PEER_ID>
```

## 5. Point the domain and Vercel at the node

1. DNS: A record `api.nocostcoin.com` -> the VM's static IP.
2. Vercel project settings:

   | Variable | Value |
   | --- | --- |
   | `INTERNAL_API_URL` | `https://api.nocostcoin.com` |
   | `NOCOSTCOIN_API_TOKEN` | the same token you passed to the launcher |

3. Redeploy the Vercel project.

## 6. Verify

```bash
curl -s https://api.nocostcoin.com/health
curl -s https://api.nocostcoin.com/stats
curl -s https://api.nocostcoin.com/consensus
```

## Everyday commands

```powershell
# Logs
gcloud compute ssh nocostcoin-validator --command "sudo docker compose -f /opt/nocostcoin/nocostcoin/docker-compose.gcp-validator.yml logs -f node-1"

# Restart after a config or code change
gcloud compute ssh nocostcoin-validator --command "MODE=restart bash ~/setup-validator.sh"

# Run the Rust test suite on the VM (real RocksDB, not a stub)
gcloud compute ssh nocostcoin-validator --command "cd /opt/nocostcoin/nocostcoin && RUN_TESTS=1 MODE=setup bash ~/setup-validator.sh"
```

## Security notes

- Port 8000 is published on `127.0.0.1` only - nginx is the only way in.
- `NOCOSTCOIN_API_TOKEN` guards the endpoints that act as the node
  (`transaction/create`, `validator/register`, `wallet/new`, `wallet/recover`).
  Reads, `/faucet` and `/transaction/send` are open.
- The faucet mints coins and is currently **enabled** on this node, so anyone
  can mint through `https://api.nocostcoin.com/faucet`. Set
  `NOCOSTCOIN_ENABLE_FAUCET=0` in `docker-compose.gcp-validator.yml` if that is
  not intended.
- The validator key lives only in `/opt/nocostcoin/nocostcoin/data/validator/`
  on the VM.
