'use client';

import { useState } from 'react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (address: string) => void;
}

export default function AuthModal({ isOpen, onClose, onConnect }: AuthModalProps) {
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!/^[0-9a-fA-F]{64}$/.test(address)) {
            setError('Invalid address. Must be 64 hexadecimal characters.');
            return;
        }

        onConnect(address);
        setAddress('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Connect Wallet</h2>
                    <button
                        className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                            Wallet Address
                        </label>
                        <input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter your 64-character hex address"
                            className="input"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter your Nocostcoin wallet address (64 hex characters)
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-sm">
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary w-full">
                        Connect Wallet
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p className="mb-1">Don&apos;t have a wallet?</p>
                    <a href="/testnet" className="text-primary-600 hover:text-primary-700 font-medium">
                        Create one in the testnet dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
