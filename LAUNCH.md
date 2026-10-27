# Nocostcoin Mainnet Launch Checklist (P0)

Tag: `mainnet-genesis-v1` (create AFTER ceremony + secured binary verified)

## Architecture

| Piece | Where |
| --- | --- |
| Node (validator) | GCP VM, Ubuntu 22.04, Docker (`docker-compose.gcp-validator.yml`) |
| Node HTTP API | `https://api.nocostcoin.com` (nginx on the VM, port 8000 stays loopback-only) |
| P2P | `tcp/9000` on the VM's public IP |
| Website / UI | Vercel (`nocostcoin.com`), talks to the node through `INTERNAL_API_URL` |

The UI is **not** on the VM. Vercel's route handlers call the node server-side,
so the node API must be reachable from the internet and the token stays in
Vercel's server environment.

## Status

- [x] P0-1 code: `mining.validator_seed` is fatal on chain_id 1
- [x] P0-1 code: genesis `initial_validators` holds hex **public keys** (seeds
      moved to `initial_validator_seeds` for devnet only)
- [x] P0-1 tooling: `nocostcoin --identity` prints the validator pubkey and
      wallet address for the ceremony
- [x] P0-1 tooling: the libp2p identity is persisted, so the PeerId survives
      restarts (bootstrap multiaddrs stay valid)
- [x] P0-2 code: API binds loopback by default, `NOCOSTCOIN_API_TOKEN` guards
      the endpoints that act as the node, faucet is off unless enabled
- [x] P0-3 configs: per-node `data_dir`, P2P on 0.0.0.0, API on loopback
- [x] P0-4 canonical genesis file: `config/genesis.toml` (time + seed frozen)
- [x] P0-4 regression tests: all shipped configs parse, all mainnet configs
      share one genesis, no mainnet config sets a validator seed
- [x] .gitignore: `*.key`, `data/`, token, logs covered
- [ ] P0-1 ceremony RUN: paste the 3 pubkeys + wallet addresses into
      `config/genesis.toml` and the four mainnet configs
- [ ] P0-2 secured binary: `sec-build.log` = Finished, re-run security-test.py
- [ ] P0-5 networking: public IP + PeerId in bootstrap, firewall open 9000 TCP
- [ ] P0-6 git tag: commit ONLY launch files, tag mainnet-genesis-v1

## Ceremony (run on each validator's own machine)

1. Build the secured binary (wait for `C:\tmp\sec-build.log` = Finished release).
2. Generate the identity. On Windows: `genesis-ceremony.bat 9000` (9001/9002 for
   the other validators). On the GCP VM:
   `MODE=identity bash ~/setup-validator.sh`.
   Both print:

   ```
   VALIDATOR_PUBKEY=<64 hex>   -> genesis.toml initial_validators
   WALLET_ADDRESS=<64 hex>     -> genesis.toml initial_funded_accounts
   ```

3. BACK UP the validator key offline (USB). Never commit, never share.
4. Copy each pubkey/wallet address into `config/genesis.toml` AND
   `config/mainnet.toml`, `mainnet2.toml`, `mainnet3.toml`, `mainnet-gcp.toml`
   (byte-identical `[genesis]`).
5. Old test DBs are already wiped. Fresh DBs are created on first start.

## Launch

```
# 1. VM
.\deploy\gcp\launch-validator.ps1 -Project <project> -Domain api.nocostcoin.com -ApiToken <secret>

# 2. Vercel project settings
INTERNAL_API_URL=https://api.nocostcoin.com
NOCOSTCOIN_API_TOKEN=<the same secret>

# 3. Point the DNS A record api.nocostcoin.com -> the VM's IP
```

Verify:

```
curl.exe -s https://api.nocostcoin.com/health
curl.exe -s https://api.nocostcoin.com/stats
python security-test.py   (faucet behaviour, writes without a token must 401)
```

## Public join info to publish

- chain_id=1, genesis_time=1789888215871,
  genesis_seed=3798dd950fe5753bf705c540701345e4b8910f09f34f73878e00751bb7a5da9e
- bootstrap: /ip4/<PUBLIC_IP>/tcp/9000/p2p/<NODE1_PEER_ID>
- API: https://api.nocostcoin.com
- binary + tag: mainnet-genesis-v1
