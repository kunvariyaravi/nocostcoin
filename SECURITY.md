# Nocostcoin Security Notes

Threat model: a node reachable from the internet. P2P on `tcp/9000`, HTTP API
behind nginx. Attackers considered: anyone on the internet, malicious peers and
transactions over gossip, buggy clients.

Every claim below was checked against the source. Anything that is documented
elsewhere but not implemented is listed under "Not implemented" - treat that
section as the current, real risk surface.

## Implemented

### API exposure
1. The API binds `127.0.0.1` by default (`NOCOSTCOIN_API_BIND` overrides it).
   Publishing it requires an explicit opt-in. In the GCP deployments the
   container listens on `0.0.0.0` but the host port is mapped to `127.0.0.1`,
   so nginx is the only way in.
2. `NOCOSTCOIN_API_TOKEN` guards the endpoints that act **as** the node:
   `/transaction/create`, `/validator/register`, `/wallet/new`,
   `/wallet/recover`. Without the token those return 401.
   Reads, `/faucet` and `/transaction/send` are open - a public node has to
   accept transactions and serve queries.
3. The faucet is disabled unless `NOCOSTCOIN_ENABLE_FAUCET=1`. The GCP validator
   compose sets it to 1 deliberately; a node that mints coins on demand has no
   monetary scarcity.
4. Request bodies are capped: 64 KB for `/transaction/send` and
   `/transaction/create`, 4 KB for `/validator/register`, `/wallet/recover` and
   `/faucet`. `warp::body::json()` does not cap bodies on its own.
5. `/blocks?limit` is clamped to 1..=100 so a single request cannot ask the node
   to assemble an unbounded response.
6. `GET /health` is an unauthenticated liveness probe, so auth can be enforced
   everywhere sensitive without breaking health checks.

### Identity and genesis
7. Genesis validators are stored as **public keys** (`initial_validators`), never
   as seeds, so the genesis file is safe to publish. The matching secret keys
   live only on their validator's machine.
8. Mainnet (`chain_id = 1`) refuses to start with `mining.validator_seed` set -
   the seed is the validator's secret key and a committed seed would let anyone
   forge blocks for that validator.
9. Mainnet refuses to start while the genesis still holds the
   `REPLACE_WITH_...` placeholders, so a chain cannot launch un-finalised.
10. The libp2p identity is persisted in `<data_dir>/libp2p_identity.key`, so the
    PeerId is stable across restarts instead of being regenerated.

### Transaction handling
11. The mempool is a `HashMap` keyed by transaction hash, so re-submitting the
    same transaction overwrites rather than growing the pool.
12. `validate_signature` checks that the sender is exactly 32 bytes before
    parsing it as an Ed25519 key, and a malformed signature length returns an
    error rather than panicking. A malformed transaction cannot take the node
    down.
13. Transactions are validated before entering the mempool: signature, balance,
    and per-type logic (amount > 0, no self-send, receiver present, and so on).

## Not implemented

These are real gaps, not theoretical ones.

- **No integer overflow checks in the reward accounting.** There is no
  `checked_add` / `checked_sub` on the block reward payout in `state.rs`. Rust
  release builds wrap silently. The amounts are `u64` so this needs implausibly
  large values to trigger, but it is not guarded.
- **No length caps on asset names/symbols.** `validate_logic` rejects empty
  names and zero supply, but nothing bounds their length.
- **No rate limiting.** Per-IP throttling is left to nginx.
- **No TLS in the node.** nginx terminates TLS; the node speaks plain HTTP.
- **Wallet files are unencrypted 32-byte secrets on disk.** Anyone with
  filesystem access has the validator key. The directory is gitignored and is
  never committed.
- **No slashing evidence gossip.** Equivocation is detected locally only; peers
  are not told.
- **The validator set is kept in memory and rebuilt on startup.** It is
  persisted to disk, but a node that misses a block containing a registration
  does not learn about that validator until it re-syncs. The set also has to
  match exactly across nodes, because the round-robin schedule is a function of
  it - a node whose set differs would reject valid blocks.
- **The faucet uses the node's hot wallet.** If it is enabled publicly, the
  node's wallet pays out - the same wallet that holds the 10,000,000 NCC faucet
  float. A dedicated faucet key would be better.
- **The faucet is one-per-address, not Sybil-proof.** Anyone can claim from any
  address they control, once each. The 10,000,000 NCC float therefore bounds the
  total outflow at 100,000 claims, but a determined operator can claim from many
  addresses.
- **`chain_id` is not part of the genesis block hash**, so the genesis hash does
  not commit to the validator set. The genesis `[genesis]` block must still be
  byte-identical across nodes; a test enforces that for the shipped configs.
