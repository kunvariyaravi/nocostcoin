import Link from 'next/link';

const NODE = 'https://api.nocostcoin.com';

export default function AgentPaymentsPage() {
    return (
        <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400 mb-6">
                Agent Payments
            </h1>

            <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                    A card rail charges fractions of a cent per call and asks you to
                    sign up for an account first. That is exactly the friction
                    that stops an AI agent from calling anything. On Nocostcoin the
                    payment <em>is</em> the transaction, so an agent pays with a
                    signature and nothing else.
                </p>

                <h2 className="text-3xl font-bold text-white mb-6">How it works</h2>

                <div className="space-y-4 text-slate-400 mb-8">
                    <p>
                        <strong className="text-white">1. The caller signs a transfer.</strong>{' '}
                        1 NCC to the service address, with its own key. The service
                        address is public, so this needs no onboarding.
                    </p>
                    <p>
                        <strong className="text-white">2. The caller broadcasts it.</strong>{' '}
                        The transaction goes to the node like any other. It lands in a
                        block in about two seconds.
                    </p>
                    <p>
                        <strong className="text-white">3. The service checks the chain itself.</strong>{' '}
                        It looks the transaction up, confirms it is in a block, that
                        it paid the right address, and that it paid enough. It trusts
                        nothing about the caller except the signature on the
                        transaction.
                    </p>
                    <p>
                        <strong className="text-white">4. The service serves the resource.</strong>{' '}
                        The caller passes the transaction hash and gets the response.
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-10">
                    There is a working example on this site:{' '}
                    <Link href="/mainnet/agent-payments" className="underline">
                        pay for an API with NCC
                    </Link>
                    . It is a real endpoint on a real chain.
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">Calling a paid endpoint</h2>

                <p className="text-slate-400 mb-4">
                    A payment is an ordinary <code>NativeTransfer</code>. The
                    transaction hash is what you hand to the service.
                </p>

                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 font-mono mb-4">
                    {`# 1. Sign and broadcast the payment
TX_HASH=$(curl -s -X POST ${NODE}/transaction/send \\
  -H 'Content-Type: application/json' \\
  -d '{
    "sender":   ["<your 32-byte public key>"],
    "receiver": ["<the service public key>"],
    "nonce":    0,
    "data":     {"NativeTransfer": {"amount": 1}},
    "signature":["<your 64-byte signature>"]
  }')

# 2. Call the service with the hash
curl -s "https://www.nocostcoin.com/api/agent/resource?payment=$TX_HASH"`}
                </pre>

                <p className="text-slate-400 mb-4">
                    From JavaScript, with any signer:
                </p>

                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 font-mono mb-10">
                    {`async function callPaidApi(serviceAddress: string, signTx: (tx: any) => Promise<any>) {
  const tx = await signTx({
    receiver: serviceAddress,
    amount: 1,              // NCC
    nonce: await nextNonce(),
  });

  const res = await fetch(\`${NODE}/transaction/send\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  const hash = (await res.text()).replace(/"/g, '');

  // The service verifies the payment against the chain itself.
  const paid = await fetch(\`/api/agent/resource?payment=\${hash}\`);
  return paid.json();
}`}
                </pre>

                <h2 className="text-3xl font-bold text-white mb-6">What signing a payment involves</h2>

                <p className="text-slate-400 mb-4">
                    The transaction hash is the SHA-256 of the fields, and the
                    signature is Ed25519 over that hash:
                </p>

                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 font-mono mb-6">
                    {`hash = sha256(
    sender   ||          // 32 bytes
    receiver ||          // 32 bytes
    nonce    ||          // 8 bytes, little endian
    "NativeTransfer" ||  // 14 bytes
    amount              // 8 bytes, little endian
)

signature = ed25519_sign(private_key, hash)`}
                </pre>

                <h2 className="text-3xl font-bold text-white mb-6">Delegating to an agent</h2>

                <p className="text-slate-400 mb-4">
                    An agent should not hold your main key. The chain has a
                    <code>DelegateSpend</code> transaction that gives a delegate key
                    a spending allowance, so you can cap what an agent can take:
                </p>

                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 font-mono mb-6">
                    {`{
  "sender":   ["<your public key>"],
  "receiver": ["<the agent's public key>"],
  "nonce":    1,
  "data":     {"DelegateSpend": {
                  "delegate":  "<the agent's public key>",
                  "allowance": 100,
                  "expiry":    0
                }},
  "signature": ["<your signature>"]
}`}
                </pre>

                <p className="text-slate-400 mb-10">
                    The agent can then spend up to the allowance without ever
                    seeing your key. The cap is enforced by the protocol, not by
                    the agent behaving itself.
                </p>

                <h2 className="text-3xl font-bold text-white mb-6">Caveats</h2>

                <div className="space-y-3 text-slate-400 mb-10">
                    <p>
                        <strong className="text-white">Replay.</strong> A serverless
                        function has no memory between calls, so the demo service
                        requires the payment to be recent - within 200 blocks,
                        about seven minutes. A production service would keep a
                        spent-hash set instead.
                    </p>
                    <p>
                        <strong className="text-white">Getting tokens.</strong> The
                        faucet gives every new address 100 NCC, once. That is enough
                        for a hundred calls.
                    </p>
                    <p>
                        <strong className="text-white">Price.</strong> NCC has no
                        market price yet. 1 NCC is priced in NCC, not in dollars.
                    </p>
                </div>

                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    The endpoint in this guide is live and takes real payments on
                    the mainnet. Try it:{' '}
                    <Link href="/mainnet/agent-payments" className="underline">
                        pay for an API with NCC
                    </Link>
                    .
                </div>
            </div>
        </div>
    );
}
