import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";

export default function About() {
    return (
        <>
            <WebsiteNavbar />
            <main className="min-h-screen pt-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-6">About Nocostcoin</h1>
                    <p className="text-2xl text-slate-400 mb-16 leading-relaxed">
                        We are building the infrastructure for the next generation of the internet—where value moves as freely as data.
                    </p>

                    <div className="prose prose-lg prose-invert max-w-none">

                        {/* The Origin Story */}
                        <section className="mb-20">
                            <h2 className="text-3xl font-bold text-white mb-6">The Origin Story</h2>
                            <p className="text-slate-300 mb-6">
                                Nocostcoin began with a simple question: <em>What if a blockchain didn&apos;t need gas fees?</em>
                            </p>
                            <p className="text-slate-300 mb-6">
                                In 2024, the blockchain landscape was fragmented. High-performance chains sacrificed decentralization, while decentralized chains were plagued by unpredictable costs and slow finality. Developers spent more time optimizing gas usage than building features, and users were priced out of micro-transactions.
                            </p>
                            <p className="text-slate-300">
                                We realized that the &quot;fee market&quot; model was a relic of scarcity. By rethinking consensus from the ground up—using <strong>determinism</strong> instead of probabilistic competition—we could eliminate the resource waste that necessitates fees. Nocostcoin was born from this vision of rigorous efficiency.
                            </p>
                        </section>

                        {/* Core Values Grid */}
                        <section className="mb-20">
                            <h2 className="text-3xl font-bold text-white mb-8">Our Core Values</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-prose">
                                <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700/50">
                                    <h3 className="text-xl font-bold text-blue-400 mb-3">Radical Accessibility</h3>
                                    <p className="text-slate-400">
                                        Technology should be inclusive. By removing fees, we lower the barrier to entry to zero. Anyone, anywhere, can participate in the global economy.
                                    </p>
                                </div>
                                <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700/50">
                                    <h3 className="text-xl font-bold text-emerald-400 mb-3">Deterministic Security</h3>
                                    <p className="text-slate-400">
                                        We don&apos;t play dice with your assets. Our consensus provides mathematical certainty and instant finality, essential for high-stakes finance.
                                    </p>
                                </div>
                                <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700/50">
                                    <h3 className="text-xl font-bold text-purple-400 mb-3">Developer First</h3>
                                    <p className="text-slate-400">
                                        We build tools we want to use. From native primitives to instant testnets, the developer experience is our north star.
                                    </p>
                                </div>
                                <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700/50">
                                    <h3 className="text-xl font-bold text-orange-400 mb-3">Sustainable Scaling</h3>
                                    <p className="text-slate-400">
                                        Growth shouldn&apos;t come at the cost of the planet. Our Proof of Determinism is energy-efficient by design, avoiding the wasteful hash wars of PoW.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* The Technology (Enhanced) */}
                        <section className="mb-20">
                            <h2 className="text-3xl font-bold text-white mb-6">The Technology Stack</h2>
                            <p className="text-slate-300 mb-6">
                                Nocostcoin isn&apos;t just a fork of an existing chain; it&apos;s a custom-built Layer 1 optimized for the machine economy.
                            </p>
                            <ul className="space-y-4 text-slate-300">
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-emerald-400">⚡</span>
                                    <span>
                                        <strong>Proof of Determinism (PoD):</strong> A consensus mechanism where the leader schedule is mathematically pre-determined but cryptographically hidden until the exact moment of block production.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-emerald-400">🛡️</span>
                                    <span>
                                        <strong>Zero-Knowledge Span Prevention:</strong> Instead of fees, we use a lightweight, memory-hard puzzle that allows legitimate users to transact freely while making spam attacks computationally prohibitively expensive.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="mt-1 text-emerald-400">🤖</span>
                                    <span>
                                        <strong>Native AI Integration:</strong> Built-in support for agent-to-agent payments and delegated signing authorities, paving the way for the autonomous economy.
                                    </span>
                                </li>
                            </ul>
                        </section>

                        {/* Our Philosophy */}
                        <section className="mb-20">
                            <h2 className="text-3xl font-bold text-white mb-6">Our Philosophy</h2>
                            <blockquote className="border-l-4 border-blue-500 pl-6 py-2 my-8 italic text-xl text-slate-300 bg-slate-800/20 rounded-r-lg">
                                &quot;The internet allowed information to move freely. Nocostcoin allows value to move freely.&quot;
                            </blockquote>
                            <p className="text-slate-300 mb-6">
                                We believe that the friction of transaction fees is the single biggest inhibitor to the &quot;Internet of Value&quot;.
                                When every interaction costs money, experimentation is stifled, and automated systems are constrained.
                            </p>
                            <p className="text-slate-300">
                                By removing this friction, we unlock use cases that were previously impossible:
                                <strong>micro-payments for content</strong>, <strong>streaming salaries</strong>, and <strong>autonomous AI agents</strong> negotiating complex economic webs in real-time.
                            </p>
                        </section>

                        {/* Strategic Roadmap */}
                        <section className="mb-20">
                            <h2 className="text-3xl font-bold text-white mb-8">Strategic Roadmap</h2>
                            <div className="space-y-8 not-prose">
                                {/* Phase 1 */}
                                <div className="relative pl-8 border-l-2 border-emerald-500/50">
                                    <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    <h3 className="text-xl font-bold text-white mb-2">Phase 1: Foundation (Completed)</h3>
                                    <p className="text-slate-400 mb-4">
                                        Establish the core consensus engine.
                                    </p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-300">
                                        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Proof of Determinism Consensus</li>
                                        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> RocksDB Storage Layer</li>
                                        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Native Asset Primitives</li>
                                        <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> P2P Networking (Libp2p)</li>
                                    </ul>
                                </div>

                                {/* Phase 2 */}
                                <div className="relative pl-8 border-l-2 border-blue-500/50">
                                    <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    <h3 className="text-xl font-bold text-white mb-2">Phase 2: Expansion (Current)</h3>
                                    <p className="text-slate-400 mb-4">
                                        Building the developer and user ecosystem.
                                    </p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-300">
                                        <li className="flex items-center gap-2"><span className="text-blue-400">⚡</span> Public Testnet Launch</li>
                                        <li className="flex items-center gap-2"><span className="text-blue-400">⚡</span> Next.js Dashboard & Explorer</li>
                                        <li className="flex items-center gap-2"><span className="text-slate-500">○</span> Mobile Wallet Implementation</li>
                                        <li className="flex items-center gap-2"><span className="text-slate-500">○</span> Real-time Metrics & Observability</li>
                                    </ul>
                                </div>

                                {/* Phase 3 */}
                                <div className="relative pl-8 border-l-2 border-slate-700">
                                    <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-slate-700"></div>
                                    <h3 className="text-xl font-bold text-white mb-2">Phase 3: Autonomy (Future)</h3>
                                    <p className="text-slate-400 mb-4">
                                        Empowering the AI economy.
                                    </p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-400">
                                        <li className="flex items-center gap-2"><span>○</span> Native AI Agent Wallets</li>
                                        <li className="flex items-center gap-2"><span>○</span> Off-chain Payment Channels</li>
                                        <li className="flex items-center gap-2"><span>○</span> Decentralized Identity (DID)</li>
                                        <li className="flex items-center gap-2"><span>○</span> Mainnet Genesis</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Join the Revolution */}
                        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-3xl p-12 text-center not-prose">
                            <h2 className="text-3xl font-bold text-white mb-6">Join the Revolution</h2>
                            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                                We are building Nocostcoin in the open. Whether you are a Rust engineer, a crypto-economist, or a community builder, there is a place for you here.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="/whitepaper"
                                    className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/25"
                                >
                                    Read Whitepaper
                                </a>
                                <a
                                    href="/testnet"
                                    className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-all"
                                >
                                    Try Testnet
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </>
    );
}
