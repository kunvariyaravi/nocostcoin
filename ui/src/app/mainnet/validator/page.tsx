'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ServerStackIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { useWallet } from '@/contexts/WalletContext';

interface ValidatorInfo {
    pubkey: string;
    stake: number;
    is_active: boolean;
    last_voted_slot: number;
}

interface NodeStats {
    height: number;
    head_hash: string;
    peer_count: number;
    balance: number;
    address: string;
    validator_pubkey: string;
}

function truncate(hex: string, head = 16, tail = 12): string {
    if (!hex) return '-';
    if (hex.length <= head + tail + 3) return hex;
    return `${hex.slice(0, head)}...${hex.slice(-tail)}`;
}

export default function ValidatorPage() {
    const { wallet, isConnected } = useWallet();
    const [validators, setValidators] = useState<ValidatorInfo[]>([]);
    const [stats, setStats] = useState<NodeStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // A validator's identity is its Schnorrkel consensus key - the key the
    // node signs blocks with. An Ed25519 browser wallet is a transaction
    // identity and can never be a validator, so the set is read from the node
    // and matched against the node's own consensus key.
    const fetchData = async () => {
        try {
            const [vRes, sRes] = await Promise.all([
                fetch('/api/node/validators', { cache: 'no-store' }),
                fetch('/api/node/stats', { cache: 'no-store' }),
            ]);

            if (!vRes.ok) throw new Error('Could not reach the node');
            setValidators(await vRes.json());
            setError(null);

            if (sRes.ok) {
                setStats(await sRes.json());
            }
        } catch (e: any) {
            setError(e.message || 'Failed to reach the node');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const totalStake = validators.reduce((sum, v) => sum + v.stake, 0);
    const thisNode = stats
        ? validators.find((v) => v.pubkey === stats.validator_pubkey) ?? null
        : null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    Validator Dashboard
                </h1>
                <p className="text-slate-400 mt-1">
                    The validators securing the mainnet, and their odds of being
                    chosen to produce the next block.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                        <ServerStackIcon className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 text-sm">Validators</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                        {loading ? '-' : validators.length}
                    </h3>
                </div>
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 text-sm">Total Stake</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                        {totalStake.toLocaleString()} NCC
                    </h3>
                </div>
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <div className="bg-violet-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-violet-400">
                        <CpuChipIcon className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 text-sm">This Node</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                        {loading ? '-' : thisNode ? 'Validator' : 'Observer'}
                    </h3>
                </div>
            </div>

            <div className="card border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-slate-400" />
                    Validator Set
                </h2>

                {error ? (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                        {error}
                    </div>
                ) : loading ? (
                    <div className="text-center py-8 text-slate-500">Loading validators...</div>
                ) : validators.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        No validators are registered.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {validators.map((v) => {
                            const probability = totalStake > 0 ? (v.stake / totalStake) * 100 : 0;
                            const isThisNode = stats?.validator_pubkey === v.pubkey;
                            return (
                                <div
                                    key={v.pubkey}
                                    className={`p-4 rounded-lg border ${
                                        isThisNode
                                            ? 'bg-emerald-500/10 border-emerald-500/20'
                                            : 'bg-slate-900 border-slate-700'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-slate-500 mb-1">
                                                Consensus key
                                                {isThisNode && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                                        this node
                                                    </span>
                                                )}
                                            </p>
                                            <code className="text-xs text-blue-300 font-mono break-all">
                                                {v.pubkey}
                                            </code>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm text-slate-500">Stake</p>
                                            <p className="text-lg font-bold text-white">
                                                {v.stake.toLocaleString()} NCC
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm text-slate-500">Leader odds</p>
                                            <p className="text-lg font-bold text-cyan-400">
                                                {probability.toFixed(2)}%
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm text-slate-500">Status</p>
                                            <p className={`text-lg font-bold ${v.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {v.is_active ? 'Active' : 'Inactive'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="card border-slate-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ServerStackIcon className="w-6 h-6 text-slate-400" />
                    This Node
                </h2>

                <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
                        <p className="text-sm text-slate-500 mb-1">Consensus key</p>
                        <code className="text-xs text-blue-300 font-mono break-all">
                            {stats?.validator_pubkey || '-'}
                        </code>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-slate-500">Block height</p>
                            <p className="font-bold text-white mt-1">
                                {stats ? stats.height.toLocaleString() : '-'}
                            </p>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-slate-500">Peers</p>
                            <p className="font-bold text-white mt-1">
                                {stats ? stats.peer_count : '-'}
                            </p>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-slate-500">Validator stake</p>
                            <p className="font-bold text-white mt-1">
                                {thisNode ? `${thisNode.stake.toLocaleString()} NCC` : 'Not a validator'}
                            </p>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-slate-500">Leader odds</p>
                            <p className="font-bold text-white mt-1">
                                {thisNode && totalStake > 0
                                    ? `${((thisNode.stake / totalStake) * 100).toFixed(2)}%`
                                    : '0%'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {isConnected && wallet && (
                <div className="card border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">Your Wallet</h2>
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
                        <p className="text-sm text-slate-500 mb-1">
                            Ed25519 address - holds coins, and is not a validator identity
                        </p>
                        <code className="text-xs text-blue-300 font-mono break-all">
                            {truncate(wallet.address)}
                        </code>
                    </div>
                </div>
            )}

            <div className="card border-blue-500/20 bg-blue-500/5">
                <p className="font-bold text-blue-300 mb-1">Want to be a validator?</p>
                <p className="text-sm text-slate-400 mb-4">
                    Validators run a node and hold a Schnorrkel consensus key. A
                    browser wallet is an Ed25519 key for spending coins and cannot
                    be a validator on its own, and staking a validator from the
                    browser is not available yet.
                </p>
                <Link
                    href="/documentation/how-to-run-node"
                    className="btn-primary inline-block"
                >
                    Read the Node Setup Guide
                </Link>
            </div>
        </div>
    );
}
