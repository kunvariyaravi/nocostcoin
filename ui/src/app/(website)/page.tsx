import Hero from "@/components/Hero/Hero";
import Features from "@/components/Features/Features";
import CodeShowcase from "@/components/CodeShowcase/CodeShowcase";
import PreFooter from "@/components/PreFooter/PreFooter";
import ValidatorEconomics from "@/components/ValidatorEconomics/ValidatorEconomics";
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <main className="min-h-screen">
      <Hero />
      <Features />

      {/* Validator Economics - the headline */}
      <section className="py-20 bg-gradient-to-b from-emerald-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Run a node. Get paid in NCC.
            </h2>
            <p className="text-xl text-slate-400">
              1,296,000 NCC is minted every 30 days and split between the
              validators that produce blocks. No stake, no lottery - every
              validator gets an equal share.
            </p>
          </div>

          <ValidatorEconomics />

          <div className="flex flex-wrap gap-4 justify-center mt-12">
            <Link href="/documentation/how-to-run-node" className="btn-primary">
              Run a Node
            </Link>
            <Link href="/mainnet/validator" className="btn-secondary">
              See the Validator Set
            </Link>
          </div>
        </div>
      </section>

      {/* Agent Payments */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Agents pay for APIs with NCC
              </h2>
              <p className="text-lg text-slate-400 mb-6">
                A card rail charges fractions of a cent per call and makes you
                sign up for an account first. That is exactly the friction that
                stops an AI agent from calling anything. On Nocostcoin the
                payment is the transaction, so an agent pays with a signature
                and nothing else.
              </p>
              <ul className="space-y-3 mb-8 text-slate-300">
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-3 text-xl">✓</span>
                  <span><strong>No API key.</strong> The caller signs a transaction; the service checks the chain itself.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-3 text-xl">✓</span>
                  <span><strong>No account, no subscription, no minimum spend.</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-3 text-xl">✓</span>
                  <span><strong>Cheap enough to be invisible.</strong> One NCC a call, settled in a 2-second block.</span>
                </li>
              </ul>
              <Link href="/mainnet/agent-payments" className="btn-primary">
                Try the live paid API
              </Link>
            </div>
            <div>
              <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-950">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-4 text-sm text-slate-500">agent-payment.sh</span>
                </div>
                <pre className="p-6 text-sm text-slate-300 overflow-x-auto font-mono">
                  {`# An agent pays 1 NCC for an API call.
      # No key. No account. Just a signature.

      curl -s "$SITE/api/agent/resource?payment=$TX_HASH"

      # 200 OK
      # {
      #   "resource": "llm.compute.quote",
      #   "quote": { "price_ncc": 1 },
      #   "settled": { "amount_ncc": 1, "slot": 41207 }
      # }`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Innovations (Replaces How It Works) */}
        <section className="py-20 bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Core Innovations</h2>
              <p className="text-xl text-slate-400">The infrastructure for the Autonomous Economy</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Zero Fees */}
              <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all group">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  💎
                </div>
                <h3 className="text-xl font-bold text-white mb-3">True Zero Fees</h3>
                <p className="text-slate-400">
                  Transaction fees are a friction we eliminated. A paid API call
                  costs 1 NCC - the transaction is the payment, so an agent can
                  spend without an account, a key or a minimum.
                </p>
              </div>

              {/* Card 2: Deterministic Consensus */}
              <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-all group">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Proof of Determinism</h3>
                <p className="text-slate-400">
                  Network latency is minimal with our VRF-based leader schedule. 2-second block times with instant, absolute finality.
                </p>
              </div>

              {/* Card 3: AI Native */}
              <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all group">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  🤖
                </div>
                <h3 className="text-xl font-bold text-white mb-3">AI Native Primitives</h3>
                <p className="text-slate-400">
                  Built for agents. Protocol-level support for delegated spending, streaming payments, and autonomous resource management.
                </p>
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
                  Nocostcoin moves complexity from the developer to the protocol. We provide the primitives you need to build the next generation of DApps.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3 text-xl">✓</span>
                    <strong>Native Assets:</strong> Create tokens without smart contracts.
                  </li>
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3 text-xl">✓</span>
                    <strong>Payment Channels:</strong> Millisecond latency for streaming.
                  </li>
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3 text-xl">✓</span>
                    <strong>Delegated Spending:</strong> Secure AI agent wallets.
                  </li>
                  <li className="flex items-center text-slate-300">
                    <span className="text-emerald-500 mr-3 text-xl">✓</span>
                    <strong>Deterministic Leader Schedule:</strong> Round-robin over the validator set.
                  </li>
                </ul>
                <div className="flex gap-4">
                  <Link href="/whitepaper" className="btn-secondary">
                    Read Whitepaper
                  </Link>
                  <Link href="/documentation/how-to-run-node" className="btn-primary">
                    Run a Node
                  </Link>
                </div>
              </div>
              <div>
                <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-800">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-950">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-sm text-slate-500">nocostcoin-agent</span>
                  </div>
                  <pre className="p-6 text-sm text-slate-300 overflow-x-auto font-mono">
                    {`// Delegate spending power to an AI Agent
let tx = Transaction {
  type: "DelegateSpend",
  delegate: "0xAgentPubKey...",
  allowance: 1000,
  expiry: "24h"
};

// Agent can now spend up to 1000 NCC 
// without knowing your private key
blockchain.submit(tx);`}
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
