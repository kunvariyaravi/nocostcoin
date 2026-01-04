import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";

export default function Terms() {
    return (
        <>
            <WebsiteNavbar />
            <main className="min-h-screen pt-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-8">Terms of Service</h1>
                    <div className="prose prose-lg prose-invert max-w-none text-slate-300">
                        <p className="lead text-xl text-slate-400">
                            Last Updated: January 2026
                        </p>

                        <h3>1. Acceptance of Terms</h3>
                        <p>
                            By accessing or using the Nocostcoin Testnet, Website, or Node Software, you agree to be bound by these Terms of Service. If you do not agree, do not use our services.
                        </p>

                        <h3>2. Testnet Environment</h3>
                        <p>
                            <strong>IMPORTANT:</strong> Nocostcoin is currently in a <strong>Testnet</strong> phase.
                        </p>
                        <ul>
                            <li><strong>No Monetary Value:</strong> Tokens (NCC) on the testnet have absolutely no monetary value. They cannot be exchanged for fiat currency or other cryptocurrencies.</li>
                            <li><strong>Data Reset:</strong> The network state may be reset at any time without notice. Balances, transactions, and account history may be wiped.</li>
                            <li><strong>Experimental Software:</strong> The software is experimental and may contain bugs, security vulnerabilities, or cause data loss.</li>
                        </ul>

                        <h3>3. No Warranty</h3>
                        <p>
                            The software is provided &quot;AS IS&quot;, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability.
                        </p>

                        <h3>4. User Responsibilities</h3>
                        <p>
                            You are responsible for maintaining the security of your private keys. Nocostcoin is a non-custodial protocol; we cannot recover your funds (even testnet funds) if you lose your keys.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
