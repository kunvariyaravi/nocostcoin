'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    PaperAirplaneIcon,
    ArrowPathIcon,
    BanknotesIcon,
    DocumentDuplicateIcon,
    CheckIcon,
    QrCodeIcon,
    ArrowTrendingUpIcon,
    BoltIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';

interface Stats {
    height: number;
    peer_count: number;
    balance: number;
    address: string;
    head_hash: string;
}

export default function TestnetDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Send State
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [sending, setSending] = useState(false);
    const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Faucet State
    const [faucetLoading, setFaucetLoading] = useState(false);
    const [faucetStatus, setFaucetStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Receive State
    const [copied, setCopied] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/node/stats');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setStats(data);
            setError(false);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    const copyToClipboard = () => {
        if (stats?.address) {
            navigator.clipboard.writeText(stats.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setTxStatus(null);

        try {
            const res = await fetch('/api/node/transaction/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver: recipient,
                    amount: parseInt(amount)
                })
            });

            if (res.ok) {
                const hash = await res.json();
                setTxStatus({ type: 'success', msg: `Sent! Hash: ${hash}` });
                setRecipient('');
                setAmount('');
                fetchStats();
            } else {
                const err = await res.json();
                setTxStatus({ type: 'error', msg: typeof err === 'object' ? (err.error || JSON.stringify(err)) : err });
            }
        } catch (e) {
            setTxStatus({ type: 'error', msg: 'Failed to send transaction' });
        } finally {
            setSending(false);
        }
    };

    const handleFaucet = async () => {
        if (!stats?.address) return;
        setFaucetLoading(true);
        setFaucetStatus(null);

        try {
            const res = await fetch('/api/node/faucet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: stats.address })
            });

            if (res.ok) {
                const data = await res.json();
                setFaucetStatus({ type: 'success', msg: `Received ${data.amount} NCC!` });
                // tx_hash available in data.tx_hash if needed
                fetchStats();
            } else {
                const err = await res.json();
                setFaucetStatus({ type: 'error', msg: typeof err === 'object' ? (err.error || JSON.stringify(err)) : err });
            }
        } catch (e) {
            setFaucetStatus({ type: 'error', msg: 'Faucet request failed' });
        } finally {
            setFaucetLoading(false);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="p-4 rounded-full bg-red-500/10 text-red-500">
                    <BoltIcon className="w-12 h-12" />
                </div>
                <h2 className="text-xl font-bold text-slate-200">Cannot Connect to Node</h2>
                <div className="p-4 bg-slate-900 rounded-lg font-mono text-sm text-slate-500 border border-slate-800">
                    Check if port 8000/9000 is active
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                    Overview
                </h1>
                <p className="text-slate-400 mt-2">Manage your testnet interactions.</p>
            </div>

            {/* Core Interaction Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Send Card */}
                <div className="card border-blue-500/20 bg-slate-800/50">
                    <div className="flex items-center gap-3 mb-4 text-blue-400">
                        <PaperAirplaneIcon className="w-6 h-6 -rotate-45" />
                        <h3 className="text-lg font-bold">Send NCC</h3>
                    </div>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                className="input font-mono text-sm bg-slate-900/50"
                                placeholder="Recipient Address"
                                required
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input font-mono bg-slate-900/50"
                                placeholder="Amount (NCC)"
                                min="1"
                                required
                            />
                        </div>
                        {txStatus && (
                            <div className={`p-2 rounded text-xs border ${txStatus.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                <p className="break-all">{txStatus.msg}</p>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={sending}
                            className="btn-primary w-full py-2 flex items-center justify-center gap-2"
                        >
                            {sending ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : 'Send Transaction'}
                        </button>
                    </form>
                </div>

                {/* 2. Receive Card */}
                <div className="card border-emerald-500/20 bg-slate-800/50">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                        <QrCodeIcon className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Receive</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-4 py-2">
                        <div className="p-3 bg-white rounded-lg">
                            {stats?.address ? (
                                <QRCodeSVG value={stats.address} size={100} />
                            ) : (
                                <div className="w-[100px] h-[100px] bg-slate-200 animate-pulse rounded"></div>
                            )}
                        </div>
                        <div className="w-full relative">
                            <div className="text-xs text-slate-500 mb-1">Your Address</div>
                            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded p-2">
                                <code className="text-xs text-blue-300 font-mono truncate flex-1 block min-w-0">
                                    {stats?.address || 'Loading...'}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                                >
                                    {copied ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Faucet Card */}
                <div className="card border-violet-500/20 bg-slate-800/50 flex flex-col">
                    <div className="flex items-center gap-3 mb-4 text-violet-400">
                        <BanknotesIcon className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Faucet</h3>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <p className="text-sm text-slate-400 mb-4">
                            Request 1,000 free NCC testnet tokens. Available once every 24 hours per node.
                        </p>

                        <div className="space-y-4">
                            {faucetStatus && (
                                <div className={`p-2 rounded text-xs border ${faucetStatus.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    <p className="break-all">{faucetStatus.msg}</p>
                                </div>
                            )}
                            <button
                                onClick={handleFaucet}
                                disabled={faucetLoading || !stats}
                                className="w-full btn-secondary border-violet-500/50 text-violet-300 hover:bg-violet-500/10 hover:border-violet-400 hover:text-white transition-all"
                            >
                                {faucetLoading ? 'Requesting...' : 'Request 1,000 NCC'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="card border-slate-700/50 h-full">
                        <h3 className="text-xl font-bold text-slate-200 mb-4">Latest Block</h3>
                        {stats ? (
                            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 space-y-3 font-mono text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Hash</span>
                                    <span className="text-blue-400 truncate max-w-[300px]">{stats.head_hash}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Height</span>
                                    <span className="text-emerald-400">#{stats.height}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-500 text-sm">Loading block info...</div>
                        )}
                        <div className="mt-4 text-right">
                            <Link href="/testnet/explorer" className="text-sm text-blue-400 hover:text-blue-300">View all blocks &rarr;</Link>
                        </div>
                    </div>
                </div>

                {/* Validator Teaser */}
                <div className="glass-panel p-6">
                    <h3 className="font-bold text-slate-200 mb-4">Validator Status</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        Secure the network and earn rewards.
                    </p>
                    <Link href="/testnet/validator" className="block w-full py-2 text-center rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 transition-colors">
                        Manage Validator
                    </Link>
                </div>
            </div>
        </div>
    );
}
