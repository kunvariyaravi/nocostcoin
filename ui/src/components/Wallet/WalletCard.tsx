'use client';

import { useState } from 'react';

interface WalletCardProps {
    address: string;
    balance: number;
    onShowQR: () => void;
}

export default function WalletCard({ address, balance, onShowQR }: WalletCardProps) {
    const [copied, setCopied] = useState(false);

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const formatAddress = (addr: string) => {
        if (addr.length <= 16) return addr;
        return `${addr.substring(0, 8)}...${addr.substring(addr.length - 8)}`;
    };

    return (
        <div className="card">
            <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">👛</div>
                <h2 className="text-2xl font-bold text-gray-900">My Wallet</h2>
            </div>

            <div className="mb-6">
                <span className="text-sm text-gray-600 block mb-2">Balance</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary-600">{balance.toLocaleString()}</span>
                    <span className="text-xl text-gray-500">NCC</span>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Your Address</span>
                    <span className="text-xs text-gray-400">Share this to receive tokens</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                        <span className="flex-1 font-mono text-sm text-gray-900 break-all leading-relaxed">
                            {address || 'Loading...'}
                        </span>
                        <button
                            className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                            onClick={copyAddress}
                            title="Copy address to clipboard"
                            disabled={!address}
                        >
                            {copied ? (
                                <span className="flex items-center gap-1">
                                    <span>✓</span>
                                    <span>Copied</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span>📋</span>
                                    <span>Copy</span>
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <button
                className="w-full btn-secondary flex items-center justify-center gap-2"
                onClick={onShowQR}
                disabled={!address}
            >
                <span>📱</span>
                Show QR Code
            </button>

            {copied && (
                <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in">
                    Address copied to clipboard!
                </div>
            )}
        </div>
    );
}
