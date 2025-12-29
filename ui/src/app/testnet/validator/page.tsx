'use client';

import { useState, useEffect } from 'react';
import {
    ServerStackIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

interface ValidatorStatus {
    pubkey: string;
    stake: number;
    is_active: boolean;
}

export default function ValidatorPage() {
    const [status, setStatus] = useState<ValidatorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [stakeAmount, setStakeAmount] = useState('1000');
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/node/validator');
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            } else {
                setStatus(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleRegister = async () => {
        setRegistering(true);
        setMsg(null);
        try {
            const res = await fetch('/api/node/validator/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stake: parseInt(stakeAmount) })
            });

            if (res.ok) {
                setMsg({ type: 'success', text: 'Validator registered successfully! Waiting for next epoch...' });
                fetchStatus();
            } else {
                const err = await res.json();
                setMsg({ type: 'error', text: typeof err === 'string' ? err : 'Registration failed' });
            }
        } catch (e) {
            setMsg({ type: 'error', text: 'Connection failed' });
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                    Validator Dashboard
                </h1>
                <p className="text-slate-400 mt-1">Manage your validator node and stake.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                        <ServerStackIcon className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 text-sm">Node Status</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                        {status?.is_active ? 'Active' : 'Inactive'}
                    </h3>
                </div>
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <div className="bg-emerald-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 text-sm">Total Stake</p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                        {status ? status.stake.toLocaleString() : '0'} NCC
                    </h3>
                </div>
                <div className="card border-slate-700/50 bg-slate-800/30">
                    <div className="bg-violet-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-violet-400">
                        <CpuChipIcon className="w-6 h-6" />
                    </div>
                    <p className="text-slate-500 text-sm">Performance</p>
                    <h3 className="text-2xl font-bold text-white mt-1">100%</h3>
                </div>
            </div>

            <div className="card border-slate-700">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-slate-400" />
                    Validator Management
                </h2>

                {loading ? (
                    <div className="text-center py-8 text-slate-500">Checking status...</div>
                ) : status ? (
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
                            <ShieldCheckIcon className="w-6 h-6" />
                            <div>
                                <p className="font-bold">You are a Validator</p>
                                <p className="text-sm opacity-80">Your node is actively participating in consensus.</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
                            <p className="text-sm text-slate-500 mb-1">Public Key</p>
                            <code className="text-xs text-blue-300 font-mono break-all">{status.pubkey}</code>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-lg mt-4">
                            <h4 className="font-bold text-slate-300 mb-2">Node Info</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>• Software Version: 0.1.0</li>
                                <li>• Protocol: PoD (Proof of Determinism)</li>
                                <li>• Slot Leader Probability: {(status.stake / 100000).toFixed(4)}% (Est.)</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                            <p className="font-bold mb-1">Become a Validator</p>
                            <p className="text-sm opacity-80">
                                Stake your NCC tokens to help secure the network and earn rewards.
                                Minimum stake is 1,000 NCC.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Stake Amount (NCC)</label>
                                <input
                                    type="number"
                                    value={stakeAmount}
                                    onChange={(e) => setStakeAmount(e.target.value)}
                                    className="input"
                                    min="1000"
                                />
                            </div>

                            {msg && (
                                <div className={`p-3 rounded-lg text-sm border ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    {msg.text}
                                </div>
                            )}

                            <button
                                onClick={handleRegister}
                                disabled={registering}
                                className="btn-primary w-full"
                            >
                                {registering ? 'Registering...' : 'Register Validator'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
