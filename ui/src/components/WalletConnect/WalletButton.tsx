'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletIcon } from '@heroicons/react/24/outline';

export default function WalletButton() {
    const { wallet, isConnected, isUnlocked, createWallet, unlockWallet, lockWallet } = useWallet();
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mnemonic, setMnemonic] = useState('');

    const handleCreate = async () => {
        if (!password) {
            setError('Please enter a password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await createWallet(password);
            setMnemonic(result.mnemonic);
            setPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create wallet');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = () => {
        if (!password) {
            setError('Please enter a password');
            return;
        }

        try {
            unlockWallet(password);
            setPassword('');
            setShowModal(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
        }
    };

    const handleLock = () => {
        lockWallet();
    };

    if (mnemonic) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
                    <h3 className="text-xl font-bold mb-4">⚠️ Save Your Recovery Phrase</h3>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                        <p className="text-red-400 text-sm mb-2">Write this down! You'll need it to recover your wallet.</p>
                        <div className="bg-slate-950 p-3 rounded font-mono text-sm text-emerald-400">
                            {mnemonic}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setMnemonic('');
                            setShowModal(false);
                        }}
                        className="btn-primary w-full"
                    >
                        I've Saved It
                    </button>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <WalletIcon className="w-5 h-5" />
                    Connect Wallet
                </button>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Create Wallet</h3>
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 mb-4"
                            />
                            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreate}
                                    disabled={loading}
                                    className="btn-primary flex-1"
                                >
                                    {loading ? 'Creating...' : 'Create Wallet'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setPassword('');
                                        setError('');
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    if (!isUnlocked) {
        return (
            <>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-secondary flex items-center gap-2"
                >
                    <WalletIcon className="w-5 h-5" />
                    <span className="text-xs font-mono">{wallet?.address.slice(0, 6)}...{wallet?.address.slice(-4)}</span>
                </button>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Unlock Wallet</h3>
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 mb-4"
                            />
                            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                            <div className="flex gap-2">
                                <button onClick={handleUnlock} className="btn-primary flex-1">
                                    Unlock
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setPassword('');
                                        setError('');
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                <p className="text-xs text-slate-400">Wallet</p>
                <p className="text-sm font-mono text-emerald-400">
                    {wallet?.address.slice(0, 6)}...{wallet?.address.slice(-4)}
                </p>
            </div>
            <button onClick={handleLock} className="btn-secondary">
                Lock
            </button>
        </div>
    );
}
