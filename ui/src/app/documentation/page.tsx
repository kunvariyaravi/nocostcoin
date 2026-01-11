import Link from 'next/link';

export default function DocumentationPage() {
    return (
        <div>
            <h1 className="text-4xl font-bold mb-6">Nocostcoin Documentation</h1>
            <p className="text-xl text-slate-300 mb-8">
                Welcome to the Nocostcoin developer hub. Here you'll find everything you need to build on Nocostcoin, run a node, and contribute to the network.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
                <Link
                    href="/documentation/how-to-run-node"
                    className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all group"
                >
                    <div className="w-12 h-12 bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-900/50 transition-colors">
                        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Run a Node</h3>
                    <p className="text-slate-400">Step-by-step guide to setting up a validator node on the Nocostcoin testnet.</p>
                </Link>

                <Link
                    href="/documentation/api"
                    className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all group"
                >
                    <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-900/50 transition-colors">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">API Reference</h3>
                    <p className="text-slate-400">Complete reference for the Nocostcoin Node API and JSON-RPC methods.</p>
                </Link>

                <Link
                    href="/documentation/architecture"
                    className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all group"
                >
                    <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-900/50 transition-colors">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Architecture</h3>
                    <p className="text-slate-400">Deep dive into the Proof of Time consensus and network topology.</p>
                </Link>
            </div>
        </div>
    );
}
