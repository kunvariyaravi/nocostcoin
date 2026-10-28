import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";
import Link from "next/link";

export default function Whitepaper() {
    return (
        <>
            <WebsiteNavbar />
            <main className="min-h-screen pt-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="mb-12 border-b border-slate-700 pb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">Nocostcoin Whitepaper 2.1</h1>
                                <p className="text-xl text-primary-400 font-medium mb-2">
                                    The Native AI Economy Blockchain
                                </p>
                                <p className="text-sm text-slate-400">
                                    Version 2.1 • January 2026
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="prose prose-lg prose-invert max-w-none space-y-12">

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">1. Executive Summary</h2>
                            <p>
                                Nocostcoin is a Layer 1 blockchain designed for the emerging machine economy, where AI agents transact autonomously at high frequency. Unlike general-purpose blockchains that rely on smart contracts for everything, Nocostcoin implements economic primitives—<strong>Native Assets</strong>, <strong>NFTs</strong>, <strong>Payment Channels</strong>, and <strong>Delegation</strong>—directly at the protocol level.
                            </p>
                            <p>
                                This architectural choice eliminates VM overhead, reduces attack surfaces, and achieves deterministic performance that AI agents require for real-time operations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">2. The Problem: AI Agents Need Determinism</h2>

                            <h3 className="text-2xl font-semibold text-white mb-4">2.1 Current Blockchain Limitations</h3>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li><strong>Latency</strong>: 12-second block times are unacceptable for machine-to-machine coordination.</li>
                                <li><strong>Gas Unpredictability</strong>: AI agents need guaranteed execution costs for budgeting.</li>
                                <li><strong>Smart Contract Risk</strong>: Basic operations (token transfers) shouldn&apos;t depend on third-party contract code.</li>
                                <li><strong>Lack of Native Delegation</strong>: Agents need limited spending authority without exposing master keys.</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">2.2 Why Turing-Completeness is Overrated</h3>
                            <p>
                                Most blockchain transactions are simple value transfers or asset operations. Nocostcoin optimizes for the 95% case by making these operations native, reserving programmability for specialized use cases.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">3. Technical Architecture</h2>

                            <h3 className="text-2xl font-semibold text-white mb-4">3.1 Consensus: Proof of Determinism (PoD)</h3>
                            <p>Nodes agree on the state using a deterministic, strictly ordered schedule based on Verified Random Functions (VRF).</p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li><strong>Deterministic Leader Schedule</strong>: The schedule is round-robin over the active validators, so every validator produces an equal share of the slots. There is no stake weighting: holding more coins buys no additional blocks.</li>
                                <li><strong>Proof of Possession</strong>: Using <code>VRF(PrivateKey, Seed)</code>, the producer proves it holds the consensus key it claims, and every node verifies that proof deterministically.</li>
                                <li><strong>Instant Finality</strong>: A 2/3 vote by validator count ensures that once a block is finalized, it cannot be reverted. &quot;Probabilistic finality&quot; is unacceptable for automated agents.</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">3.2 State Machine</h3>

                            <p>The state uses a <strong>Merkle Patricia Trie</strong> but is segmented into specialized Registries for performance:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li><strong>Account Registry</strong>: Balances and Nonces.</li>
                                <li><strong>Asset Registry</strong>: Metadata for native tokens and NFTS.</li>
                                <li><strong>Channel Registry</strong>: State of open payment channels.</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">3.3 Spam Prevention</h3>
                            <p>
                                Zero-fee transactions mean there is no economic cost to
                                spam, so spam resistance currently comes from protocol
                                limits rather than from fees.
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li><strong>Mempool Cap</strong>: The mempool holds a bounded number of transactions, so a flood cannot grow the node&apos;s memory without limit.</li>
                                <li><strong>Sequential Nonces</strong>: Each account&apos;s transactions must use consecutive nonces, so a single account cannot flood the mempool with parallel transactions.</li>
                                <li><strong>One-Time Faucet Claims</strong>: Each address can claim from the faucet once, ever, which bounds the outflow.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">4. Native Primitives</h2>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">4.1 Native Assets</h3>
                            <p className="mb-4">Creating a token on Nocostcoin doesn&apos;t require writing code:</p>
                            <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300">
                                {`Transaction {
    data: CreateAsset {
        symbol: "USDN",
        name: "USD Nocostcoin",
        max_supply: 1_000_000_000,
        decimals: 6,
    }
}`}
                            </pre>
                            <p className="mt-4"><strong>Advantages:</strong></p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Same performance as native coin transfers</li>
                                <li>No rug-pull risk (code is protocol-defined)</li>
                                <li>Lower gas costs</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">4.2 NFTs</h3>
                            <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300">
                                {`Transaction {
    data: MintNFT {
        collection_id: "0x...",
        metadata_uri: "ipfs://...",
        owner: "0x...",
    }
}`}
                            </pre>
                            <p className="mt-4">Ownership is a first-class protocol concept, not buried in contract storage.</p>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">4.3 Payment Channels (Streaming)</h3>
                            <p><strong>Problem</strong>: Paying an LLM $0.0001 per generated token creates millions of on-chain transactions.</p>
                            <p className="mt-2"><strong>Solution</strong>: Off-chain payment channels.</p>
                            <ol className="list-decimal pl-6 space-y-2 mt-2">
                                <li><code>OpenChannel</code>: Lock funds on-chain</li>
                                <li>Exchange signed balance updates off-chain (millisecond latency)</li>
                                <li><code>CloseChannel</code>: Settle final state on-chain</li>
                            </ol>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">4.4 Delegated Spending (AI Agent Wallets)</h3>
                            <p><strong>Problem</strong>: You want an AI agent to trade for you but don&apos;t want to give it your private key.</p>
                            <p className="mt-2"><strong>Solution</strong>: Protocol-level spending limits.</p>
                            <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 mt-4">
                                {`Transaction {
    data: DelegateSpend {
        delegate: agent_pubkey,
        max_amount: 100,
        expiry: timestamp + 86400, // 24 hours
    }
}`}
                            </pre>
                            <p className="mt-4">The protocol enforces the limit. If the agent is compromised, you only lose 100 tokens.</p>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">5. Security Analysis</h2>
                            <h3 className="text-2xl font-semibold text-white mb-4">5.1 Implemented Protections</h3>
                            <ul className="list-disc pl-6 text-slate-400 space-y-2">
                                <li><strong>VRF Grinding Prevention</strong>: Chained randomness makes pre-computing advantageous slots impossible</li>
                                <li><strong>Equivocation Slashing</strong>: A validator that signs two different blocks for the same slot is slashed and loses its deposit</li>
                                <li><strong>Validator Deposit</strong>: Joining the validator set costs a refundable 100 NCC deposit, so flooding the schedule with throwaway keys is not free</li>
                                <li><strong>Registration Proof</strong>: A validator registration carries a Schnorrkel signature by the consensus key, so nobody can register a key they do not hold</li>
                                <li><strong>Merkle Proofs</strong>: All state transitions include Merkle root validation</li>
                                <li><strong>Atomic Updates</strong>: Failed transactions roll back state changes</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">5.2 Attack Vectors & Mitigations</h3>
                            <ul className="list-disc pl-6 text-slate-400 space-y-2">
                                <li><strong>Long-Range Attacks</strong>: Checkpointing (planned for mainnet)</li>
                                <li><strong>Nothing-at-Stake</strong>: Not applicable (deterministic leader schedule)</li>
                                <li><strong>DDoS</strong>: Secret leader election prevents targeting before block production</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">6. Performance Characteristics</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-slate-900 p-6 rounded-lg">
                                    <h3 className="font-bold text-white mb-2">Throughput</h3>
                                    <ul className="text-sm text-slate-400 space-y-1">
                                        <li>Block Time: 2s</li>
                                        <li>Tx/Block: 100</li>
                                        <li>TPS: ~50</li>
                                    </ul>
                                </div>
                                <div className="bg-slate-900 p-6 rounded-lg">
                                    <h3 className="font-bold text-white mb-2">Latency</h3>
                                    <ul className="text-sm text-slate-400 space-y-1">
                                        <li>Confirmation: 2s</li>
                                        <li>Finality: 6s</li>
                                        <li>Channels: &lt;10ms</li>
                                    </ul>
                                </div>
                                <div className="bg-slate-900 p-6 rounded-lg">
                                    <h3 className="font-bold text-white mb-2">Scalability</h3>
                                    <ul className="text-sm text-slate-400 space-y-1">
                                        <li>Parallel Execution (Future)</li>
                                        <li>State Pruning (Future)</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">7. Economic Model</h2>
                            <h3 className="text-2xl font-semibold text-white mb-4">7.1 Zero-Fee Architecture</h3>
                            <p className="mb-4">
                                Unlike traditional blockchains that treat blockspace as a commodity to be auctioned, Nocostcoin treats it as a public utility protected by computational barriers rather than financial ones.
                            </p>
                            <ul className="list-disc pl-6 text-slate-400 space-y-2">
                                <li><strong>User Cost</strong>: Zero financial cost. There are no fees to bid for blockspace.</li>
                                <li><strong>Validator Incentives</strong>: Validators are rewarded via block rewards (inflation) rather than fees, aligning long-term network security with token value.</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">7.2 Token Supply</h3>
                            <ul className="list-disc pl-6 text-slate-400 space-y-2">
                                <li><strong>Genesis Supply</strong>: 11,296,000 NCC - a 10,000,000 NCC faucet float and a 1,296,000 NCC reward pool.</li>
                                <li><strong>Inflationary Rewards</strong>: 1,296,000 NCC minted every 720 epochs (30 days) into the reward pool.</li>
                                <li><strong>Block Reward</strong>: 1 NCC to the producer of each block, paid out of the reward pool.</li>
                                <li><strong>Faucet</strong>: 100 NCC per address, one claim per address ever.</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-white mb-4 mt-8">7.3 Validator Deposits</h3>
                            <ul className="list-disc pl-6 text-slate-400 space-y-2">
                                <li><strong>Minimum Deposit</strong>: 100 NCC, refundable on exit</li>
                                <li><strong>Forfeiture</strong>: 100% of the deposit for equivocation</li>
                                <li><strong>Slot Share</strong>: Equal - 1/N of the slots for N active validators. There is no stake, so more coins buy no more blocks.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">8. Roadmap</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-green-400 mb-2">✅ Phase 1 - Completed</h3>
                                    <p className="text-slate-400">Core consensus (PoD), Native primitives, libp2p networking, RocksDB storage, deterministic round-robin leader schedule</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-yellow-400 mb-2">🚧 Phase 2 - In Progress</h3>
                                    <p className="text-slate-400">Next.js dashboard UI, Real-time metrics (Prometheus), Transaction history indexing, Enhanced API endpoints</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-300 mb-2">📋 Phase 3 - Planned</h3>
                                    <p className="text-slate-400">Transaction fees & gas, Finality mechanism, Mobile wallet, Light client support</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">9. Use Cases</h2>
                            <ul className="space-y-4">
                                <li>
                                    <strong className="text-white">AI Agent Marketplaces</strong>
                                    <p className="text-slate-400 text-sm mt-1">Atomic swaps, streaming payments, and delegated wallets facilitate autonomous trade.</p>
                                </li>
                                <li>
                                    <strong className="text-white">High-Frequency Trading</strong>
                                    <p className="text-slate-400 text-sm mt-1">Deterministic block times enable predictable strategies without mempool manipulation.</p>
                                </li>
                                <li>
                                    <strong className="text-white">Micropayments</strong>
                                    <p className="text-slate-400 text-sm mt-1">Payment channels support millions of interactions (e.g., streaming content, API calls) with minimal chain footprint.</p>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">10. Comparison</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="text-xs uppercase bg-slate-900 text-slate-200">
                                        <tr>
                                            <th className="px-6 py-3">Feature</th>
                                            <th className="px-6 py-3">Nocostcoin</th>
                                            <th className="px-6 py-3">Ethereum</th>
                                            <th className="px-6 py-3">Solana</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-slate-800">
                                            <td className="px-6 py-4 font-medium text-white">Block Time</td>
                                            <td className="px-6 py-4 text-green-400">2s</td>
                                            <td className="px-6 py-4">12s</td>
                                            <td className="px-6 py-4">400ms</td>
                                        </tr>
                                        <tr className="border-b border-slate-800">
                                            <td className="px-6 py-4 font-medium text-white">Native Assets</td>
                                            <td className="px-6 py-4 text-green-400">✅ Yes</td>
                                            <td className="px-6 py-4">❌ Contracts</td>
                                            <td className="px-6 py-4">✅ Yes</td>
                                        </tr>
                                        <tr className="border-b border-slate-800">
                                            <td className="px-6 py-4 font-medium text-white">Consensus</td>
                                            <td className="px-6 py-4 text-green-400">PoD (VRF)</td>
                                            <td className="px-6 py-4">PoS</td>
                                            <td className="px-6 py-4">PoH+PoS</td>
                                        </tr>
                                        <tr className="border-b border-slate-800">
                                            <td className="px-6 py-4 font-medium text-white">Focus</td>
                                            <td className="px-6 py-4 text-green-400">AI Economy</td>
                                            <td className="px-6 py-4">General</td>
                                            <td className="px-6 py-4">Prioritizes Speed</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6">11. Conclusion</h2>
                            <p className="text-lg text-slate-300">
                                Nocostcoin demonstrates that <strong>specialized blockchains can outperform general-purpose chains</strong> for specific use cases. By moving economic primitives to the protocol level and using deterministic consensus, we achieve predictable performance, lower fees, and higher security for the autonomous future.
                            </p>
                        </section>

                        <div className="border-t border-slate-800 pt-8 mt-12">
                            <h3 className="text-lg font-bold text-white mb-4">Appendix A: References</h3>
                            <ul className="list-disc pl-6 text-slate-400 text-sm space-y-2">
                                <li><a href="https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-vrf" className="hover:text-primary-400 transition-colors">VRF Specification (IETF)</a></li>
                                <li><a href="https://github.com/w3f/schnorrkel" className="hover:text-primary-400 transition-colors">schnorrkel Library</a></li>
                                <li><a href="https://docs.libp2p.io/" className="hover:text-primary-400 transition-colors">libp2p Documentation</a></li>
                                <li><a href="https://github.com/facebook/rocksdb/wiki" className="hover:text-primary-400 transition-colors">RocksDB Architecture</a></li>
                            </ul>
                        </div>

                        <div className="text-center pt-12 text-slate-500 italic">
                            Powering the Autonomous Future.
                        </div>

                    </div>
                </div>
            </main>
        </>
    );
}
