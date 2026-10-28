'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BoltIcon, CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useWallet } from '@/contexts/WalletContext';
import * as BrowserWallet from '@/lib/wallet/browserWallet';
import {
    AGENT_PRICE_NCC,
    AGENT_SERVICE_ADDRESS,
    BLOCK_TIME_SECONDS,
} from '@/lib/agentPayments';

interface AgentStats {
    height: number;
    price_ncc: number;
    service_address: string;
    block_time_seconds: number;
    payments_in_last_100_blocks: number;
    volume_in_last_100_blocks: number;
    recent: { tx: string; block: string; payer: string; amount: number; slot: number }[];
}

const CURL_EXAMPLE = `# Pay for the resource, then call it.
# An agent needs no API key - the chain is the payment rail.

PAY_TX=$(curl -s -X POST $NCC_NODE/transaction/send \\
  -H 'Content-Type: application/json' \\
  -d '{"sender":["<your pubkey>"],"receiver":["<service pubkey>"],
       "nonce":0,"data":{"NativeTransfer":{"amount":1}},
       "signature":["<your signature>"]}')

# Wait for it to land, then fetch the resource with the tx hash.
curl -s "$SITE/api/agent/resource?payment=$PAY_TX"`;

const JS_EXAMPLE = `// An AI agent paying for an API call, with NCC instead of a key.
const price = 1; // NCC

async function callPaidApi(serviceAddress: string, signTx: (tx: any) => Promise<string>) {
  const tx = await signTx({
    receiver: serviceAddress,
    amount: price,
    nonce: await nextNonce(),
  });

  const res = await fetch(\`\${NCC_NODE}/transaction/send\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  const hash = await res.text();

  // The service checks the chain itself before it serves anything.
  const paid = await fetch(\`/api/agent/resource?payment=\${hash}\`);
  return paid.json();
}`;

export default function AgentPaymentsPage() {
    const { wallet, isConnected, isUnlocked } = useWallet();
    const [stats, setStats] = useState<AgentStats | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [paying, setPaying] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [resource, setResource] = useState<any>(null);

    const loadStats = useCallback(async () => {
        try {
            const res = await fetch('/api/agent/stats', { cache: 'no-store' });
            if (res.ok) setStats(await res.json());
        } catch {
            // The stats are a nicety - the demo still works without them.
        }
    }, []);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 5000);
        return () => clearInterval(interval);
    }, [loadStats]);

    const loadBalance = useCallback(async () => {
        if (!wallet?.address) {
            setBalance(null);
            return;
        }
        try {
            const res = await fetch(`/api/node/account/${wallet.address}`, { cache: 'no-store' });
            if (res.ok) {
                const account = await res.json();
                setBalance(account.balance);
            }
        } catch {
            setBalance(null);
        }
    }, [wallet?.address]);

    useEffect(() => {
        loadBalance();
    }, [loadBalance]);

    const pay = async () => {
        if (!wallet?.address || !wallet.publicKey) return;

        setPaying(true);
        setStatus({ type: 'info', message: 'Signing the payment...' });
        setResource(null);

        try {
            const accountRes = await fetch(`/api/node/account/${wallet.address}`, { cache: 'no-store' });
            if (!accountRes.ok) throw new Error('Could not read your account');
            const account = await accountRes.json();

            if (account.balance < AGENT_PRICE_NCC) {
                throw new Error(
                    `You need at least ${AGENT_PRICE_NCC} NCC to call this. Claim some from the faucet first.`
                );
            }

            setStatus({ type: 'info', message: 'Signing...' });
            const signedTx = await BrowserWallet.createAndSignTransaction(
                wallet,
                AGENT_SERVICE_ADDRESS,
                AGENT_PRICE_NCC,
                account.nonce
            );

            setStatus({ type: 'info', message: 'Broadcasting to the network...' });
            const res = await fetch('/api/node/transaction/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signedTx),
            });
            const text = await res.text();
            if (!res.ok) throw new Error(text || 'The node rejected the transaction');

            const txHash = text.replace(/^"|"$/g, '');
            setStatus({ type: 'info', message: `Paid. Waiting for the block... (${txHash.slice(0, 16)}...)` });

            // Wait for the payment to be confirmed in a block.
            let confirmed = false;
            for (let attempt = 0; attempt < 30; attempt++) {
                await new Promise((r) => setTimeout(r, 2000));
                const txRes = await fetch(`/api/node/transaction/${txHash}`, { cache: 'no-store' });
                if (txRes.ok) {
                    const record = await txRes.json();
                    if (record.status === 'confirmed') {
                        confirmed = true;
                        break;
                    }
                }
            }
            if (!confirmed) throw new Error('The payment did not confirm in time');

            setStatus({ type: 'info', message: 'Payment confirmed. Fetching the resource...' });
            const paid = await fetch(`/api/agent/resource?payment=${txHash}`, { cache: 'no-store' });
            const data = await paid.json();
            if (!paid.ok) throw new Error(data.error || 'The service refused the payment');

            setResource(data);
            setStatus({ type: 'success', message: 'Paid 1 NCC. Here is your resource.' });
            loadBalance();
            loadStats();
        } catch (e: any) {
            setStatus({ type: 'error', message: e.message || 'The payment failed' });
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-400">
                    Pay for an API with NCC
                </h1>
                <p className="text-slate-400 mt-1">
                    A real endpoint on this site, paid for on the chain. No API key,
                    no account, no subscription - just a transaction and a signature.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <p className="text-slate-500 text-sm">Price per call</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                        {AGENT_PRICE_NCC} NCC
                    </h3>
                </div>
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <p className="text-slate-500 text-sm">Chain height</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                        {stats ? stats.height.toLocaleString() : '-'}
                    </h3>
                </div>
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <p className="text-slate-500 text-sm">Calls in last 100 blocks</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                        {stats ? stats.payments_in_last_100_blocks : '-'}
                    </h3>
                </div>
            </div>

            <div className="card border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BoltIcon className="w-6 h-6 text-violet-400" />
                    Try it
                </h2>

                <p className="text-sm text-slate-400 mb-4">
                    Paying 1 NCC to{' '}
                    <code className="text-xs text-blue-300 font-mono break-all">
                        {AGENT_SERVICE_ADDRESS}
                    </code>{' '}
                    buys one call. Blocks take {BLOCK_TIME_SECONDS} seconds, so the
                    whole round trip is a few seconds.
                </p>

                {!isConnected ? (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                        <p className="font-bold mb-1">Connect a wallet first</p>
                        <p className="text-sm opacity-80 mb-3">
                            You need at least {AGENT_PRICE_NCC} NCC. If you have no
                            tokens, the faucet gives every new address {AGENT_PRICE_NCC * 100} NCC.
                        </p>
                        <Link href="/mainnet" className="btn-primary inline-block">
                            Go to the Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-slate-500">Your balance</p>
                                <p className="font-bold text-white mt-1">
                                    {balance === null ? '-' : `${balance} NCC`}
                                </p>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <p className="text-slate-500">Wallet</p>
                                <p className="font-bold text-white mt-1 font-mono text-xs break-all">
                                    {wallet?.address?.slice(0, 20)}...
                                </p>
                            </div>
                        </div>

                        {balance !== null && balance < AGENT_PRICE_NCC && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                                You need at least {AGENT_PRICE_NCC} NCC. Claim from the
                                faucet on the dashboard first.
                            </div>
                        )}

                        {!isUnlocked && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                                Unlock your wallet to sign the payment.
                            </div>
                        )}

                        {status && (
                            <div
                                className={`p-3 rounded-lg text-sm border ${
                                    status.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : status.type === 'error'
                                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                          : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                }`}
                            >
                                {status.message}
                            </div>
                        )}

                        <button
                            onClick={pay}
                            disabled={paying || !isUnlocked}
                            className="btn-primary"
                        >
                            {paying ? 'Paying...' : `Pay ${AGENT_PRICE_NCC} NCC and call the API`}
                        </button>
                    </div>
                )}
            </div>

            {resource && (
                <div className="card border-emerald-500/30 bg-emerald-500/5">
                    <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                        <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                        Your resource
                    </h2>
                    <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-emerald-300 font-mono">
                        {JSON.stringify(resource, null, 2)}
                    </pre>
                </div>
            )}

            <div className="card border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6 text-slate-400" />
                    Call it from an agent
                </h2>

                <p className="text-sm text-slate-400 mb-4">
                    The payment is signed by the caller and verified by the service
                    against the chain. The service trusts nothing about the caller
                    except the signature on the transaction.
                </p>

                <h3 className="text-sm font-bold text-slate-300 mb-2">cURL</h3>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-slate-300 font-mono mb-6">
                    {CURL_EXAMPLE}
                </pre>

                <h3 className="text-sm font-bold text-slate-300 mb-2">JavaScript</h3>
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-slate-300 font-mono">
                    {JS_EXAMPLE}
                </pre>
            </div>

            {stats && stats.recent.length > 0 && (
                <div className="card border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Recent calls
                    </h2>
                    <div className="space-y-2">
                        {stats.recent.map((r) => (
                            <div
                                key={`${r.tx}-${r.slot}`}
                                className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm"
                            >
                                <Link
                                    href={`/mainnet/explorer/tx/${r.tx}`}
                                    className="text-blue-300 font-mono text-xs hover:underline"
                                >
                                    {r.tx.slice(0, 20)}...
                                </Link>
                                <span className="text-slate-400 shrink-0 ml-4">
                                    {r.amount} NCC &middot; slot {r.slot}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
