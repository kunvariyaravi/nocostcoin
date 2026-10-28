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
- [x] P0-1 ceremony RUN: this validator's pubkey and wallet address are in
      `config/genesis.toml` and the four mainnet configs
- [x] P0-2 image built: Cloud Build -> Artifact Registry
      (`us-central1-docker.pkg.dev/project-27b2e686-c994-416d-ba1/nocostcoin/node:v3`)
- [x] P0-5 networking: static IP + PeerId published, firewall open 9000 TCP
- [ ] P0-6 git tag: tag mainnet-genesis-v1
- [ ] DNS: A record `api.nocostcoin.com` -> 34.173.45.47
- [ ] TLS: re-run with `DOMAIN=api.nocostcoin.com` once DNS resolves (certbot)

## Deployed

| | |
| --- | --- |
| VM | `nocostcoin-validator`, us-central1-a, e2-micro (Always Free) |
| Static IP | 34.173.45.47 |
| Node API | http://34.173.45.47 (nginx, loopback 8000 behind it) |
| P2P | 9000 (public) |
| Image | `.../nocostcoin/node:v3` (188 MB) |
| PeerId | `12D3KooWBcQetE4pFxvzomqjy5iHHzbEziHYqFjEm3DnxztqJ65T` |
| bootstrap | `/ip4/34.173.45.47/tcp/9000/p2p/12D3KooWBcQetE4pFxvzomqjy5iHHzbEziHYqFjEm3DnxztqJ65T` |
| Validator pubkey | `128587edd4d3903363c5b837e877dfdf12732f50d7acc2970dacdcae22048c2c` |
| Wallet address | `dd5b099c02335b7e4f3d6f5e36ea85f9d02117318d52ce7e1fa3cb54dfc2ebeb` |
| Genesis hash | `2089d31e548262e99229cc69d58444bc0709574b40c76309080715878c522804` |
| Genesis time | 1793120271511 |
| Secret keys | on the VM only, `/opt/nocostcoin/nocostcoin/data/validator/` |

The API token lives in `/opt/nocostcoin/nocostcoin/.env` on the VM and must be
set as `NOCOSTCOIN_API_TOKEN` on the Vercel project too.

## Ceremony (run on the validator's own machine)

The launch ships **one validator**, the GCP node. It wins every slot, so blocks
come at the full rate.

1. Build the secured binary (wait for `C:\tmp\sec-build.log` = Finished release).
2. Generate the identity ON the machine that will run it. On the GCP VM:

   ```bash
   MODE=identity bash ~/setup-validator.sh
   ```

   On Windows: `genesis-ceremony.bat`. Both print only the public values:

   ```
   VALIDATOR_PUBKEY=<64 hex>   -> genesis.toml initial_validators
   WALLET_ADDRESS=<64 hex>     -> genesis.toml initial_funded_accounts
   ```

3. BACK UP the validator key offline (USB). Never commit, never share. It is the
   node's consensus identity and it cannot be rotated without a new genesis.
4. Paste both values into `config/genesis.toml` AND `config/mainnet.toml`,
   `mainnet2.toml`, `mainnet3.toml`, `mainnet-gcp.toml` (byte-identical
   `[genesis]`).
5. Old test DBs are already wiped. Fresh DBs are created on first start.

### Adding validators later

`/validator/register` is disabled. It can only attest to the Ed25519 wallet,
while leader election matches the Schnorrkel consensus key, so registering would
add an unrelated key to the validator set and dilute the real validator's slot
odds. Adding a validator needs a registration transaction that carries and
proves ownership of a consensus key - see "Not implemented" in `SECURITY.md`.

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
