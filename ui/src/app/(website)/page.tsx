import Hero from "@/components/Hero/Hero";
import Features from "@/components/Features/Features";
import CodeShowcase from "@/components/CodeShowcase/CodeShowcase";
import PreFooter from "@/components/PreFooter/PreFooter";
import Link from 'next/link';
import WebsiteNavbar from "@/components/Navbar/WebsiteNavbar";

export default function Home() {
  return (
    <>
      <WebsiteNavbar />
      <main className="min-h-screen">
        <Hero />
        <Features />

        {/* How It Works */}
        <section className="py-20 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-xl text-slate-400">Revolutionary technology powering the future of blockchain</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Proof of Determinism</h3>
                <p className="text-slate-400">Every slot has exactly one valid leader, mathematically proven through VRF-based sortition. No forks, no uncertainty.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Secret Leader Selection</h3>
                <p className="text-slate-400">Leaders are chosen using private VRF keys. Identity revealed only when producing blocks, preventing targeted attacks.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Instant Consensus</h3>
                <p className="text-slate-400">Deterministic finality in 2 seconds. Transactions are final the moment they&apos;re included in a block.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Highlight */}
        <section className="py-20 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">Built for the Future</h2>
                <p className="text-lg text-slate-400 mb-6">
                  Nocostcoin isn&apos;t just another blockchain. It&apos;s a fundamental rethinking of how distributed consensus should work.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3">✓</span>
                    VRF-based leader election
                  </li>
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3">✓</span>
                    Merkle Patricia Trie state management
                  </li>
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3">✓</span>
                    Ed25519 cryptographic signatures
                  </li>
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3">✓</span>
                    Native account abstraction
                  </li>
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3">✓</span>
                    Built-in DeFi primitives
                  </li>
                </ul>
                <Link href="/whitepaper" className="btn-secondary inline-block">
                  Read the Whitepaper →
                </Link>
              </div>
              <div>
                <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-950">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-sm text-slate-500">nocostcoin-core</span>
                  </div>
                  <pre className="p-6 text-sm text-slate-300 overflow-x-auto">
                    {`// Zero-fee transaction
let tx = Transaction {
  from: alice,
  to: bob,
  amount: 100,
  fee: 0, // Always zero!
};

// Instant finality
blockchain.submit(tx);
// ✓ Confirmed in 2 seconds`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CodeShowcase />
        <PreFooter />
      </main>
    </>
  );
}
