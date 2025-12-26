import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";
import Link from "next/link";

export default function Whitepaper() {
    return (
        <>
            <WebsiteNavbar />
            <main className="min-h-screen pt-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="mb-12 border-b border-gray-200 pb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-5xl font-bold text-gray-900 mb-4">Nocostcoin Whitepaper 2.0</h1>
                                <p className="text-xl text-primary-600 font-medium mb-2">
                                    The Native AI Economy Blockchain
                                </p>
                                <p className="text-sm text-gray-500">
                                    Version 2.0.0 • December 2025
                                </p>
                            </div>
                            <Link href="/WHITEPAPER.md" className="btn-primary flex items-center gap-2" download>
                                <span className="text-lg">📥</span> Download
                            </Link>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none text-gray-700 space-y-12">

                        <section>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">1. Executive Summary</h2>
                            <p>
                                Nocostcoin is a high-performance Layer 1 blockchain explicitly designed for the <strong>Machine Economy</strong>.
                                It moves beyond the limitations of general-purpose Virtual Machines (like the EVM) by implementing high-frequency
                                economic primitives—Assets, NFTs, and Streaming—directly into the core protocol.
                            </p>
                            <p>
                                By enshrining these features (&quot;Native Primitives&quot;), Nocostcoin achieves raw machine performance, lower fees,
                                and higher security for AI agents, while eliminating the &quot;smart contract risk&quot; associated with basic operations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">2. The Thesis: AI Needs Determinism</h2>
                            <p>
                                Integrating AI agents into the economy requires three things that current chains fail to provide effectively:
                            </p>
                            <ol className="list-decimal pl-6 space-y-2 mt-4">
                                <li><strong>Low Latency</strong>: Agents communicating machine-to-machine cannot wait 12 seconds for a block.</li>
                                <li><strong>Native Delegation</strong>: Agents need limited, revocable spending authority without complex wallet abstraction contracts.</li>
                                <li><strong>Streaming Payments</strong>: Paying for compute/inference requires continuous micro-transactions, not discrete transfers.</li>
                            </ol>
                            <p className="mt-4">
                                Nocostcoin solves this by optimizing for these specific use cases at the <strong>Protocol Level</strong>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">3. Technical Architecture</h2>

                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">3.1 Consensus: Proof of Determinism (PoD)</h3>
                            <p>Nodes agree on the state using a deterministic, strictly ordered schedule based on Verified Random Functions (VRF).</p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li><strong>Secret Leader Election (SLE)</strong>: Using <code>VRF(PrivateKey, Seed)</code>, validators determine if it is their turn to propose a block without broadcasting their identity beforehand. This eliminates DDoS vectors.</li>
                                <li><strong>Instant Finality</strong>: A 2/3 weighted vote ensures that once a block is finalized, it cannot be reverted. &quot;Probabilistic finality&quot; is unacceptable for automated agents.</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">3.2 State Machine</h3>

                            <p>The state uses a <strong>Merkle Patricia Trie</strong> but is segmented into specialized Registries for performance:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li><strong>Account Registry</strong>: Balances and Nonces.</li>
                                <li><strong>Asset Registry</strong>: Metadata for native tokens and NFTS.</li>
                                <li><strong>Channel Registry</strong>: State of open payment channels.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">4. Native Primitives (The &quot;No Code&quot; Layer)</h2>
                            <p>Unlike Ethereum, where creating a token requires writing and deploying code (ERC-20), Nocostcoin handles this via transaction types.</p>

                            <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">4.1 Native Assets & NFTs</h3>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li><strong>Tokens</strong>: Created via <code>CreateAsset</code>. Balances are tracked natively in the Account struct. Transferring USDC on Nocostcoin is as fast and cheap as transferring the native coin.</li>
                                <li><strong>NFTs</strong>: Created via <code>CreateCollection</code> and <code>MintNFT</code>. Ownership is a core database field.</li>
                            </ul>

                            <h3 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">4.2 AI Economy Primitives</h3>

                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 my-6">
                                <h4 className="font-bold text-lg text-blue-900 mb-2">4.2.1 Native Delegation (Agent Wallets)</h4>
                                <p className="text-gray-700"><strong>Problem</strong>: You want an AI agent to trade for you, but don&apos;t want to give it your private key.</p>
                                <p className="text-gray-700 mt-2"><strong>Solution</strong>: <code>DelegateSpend</code> transaction.</p>
                                <ul className="list-disc pl-6 mt-2 text-sm text-gray-600">
                                    <li>Alice authorizes Bob (Agent Key) to spend up to 50 coins.</li>
                                    <li>The protocol enforces this limit.</li>
                                    <li>If Bob is compromised, Alice only loses 50 coins.</li>
                                </ul>
                            </div>

                            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 my-6">
                                <h4 className="font-bold text-lg text-purple-900 mb-2">4.2.2 Payment Channels (Streaming)</h4>
                                <p className="text-gray-700"><strong>Problem</strong>: Paying an LLM 0.001 cent per token generated creates too many blockchain transactions.</p>
                                <p className="text-gray-700 mt-2"><strong>Solution</strong>: <code>OpenChannel</code> → Off-chain Sig Exchange → <code>CloseChannel</code>.</p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">5. Security & Performance</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Performance</h3>
                                    <ul className="list-disc pl-6 text-gray-600">
                                        <li><strong>No VM Overhead</strong>: &quot;Transfer Token&quot; is a direct database update.</li>
                                        <li><strong>Parallel Validation</strong>: Non-conflicting transactions validated in parallel threads.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Security</h3>
                                    <ul className="list-disc pl-6 text-gray-600">
                                        <li><strong>Rug-Pull Resistant</strong>: Tokens cannot contain malicious &quot;honeypot&quot; code.</li>
                                        <li><strong>Flash Loan Resistant</strong>: Atomic state updates prevent oracle manipulation.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <div className="text-center pt-12 border-t border-gray-100 italic text-gray-500">
                            Powering the Autonomous Future.
                        </div>

                    </div>
                </div>
            </main>
        </>
    );
}
