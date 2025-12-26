'use client';

import { useState, useEffect } from 'react';
import AuthModal from '../AuthModal/AuthModal';

interface FaucetResponse {
    tx_hash: string;
    amount: number;
    next_claim_time: number;
}

export default function Faucet() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [status, setStatus] = useState<null | { type: 'success' | 'error', message: string }>(null);
    const [loading, setLoading] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('faucet_wallet_address');
        if (saved) setWalletAddress(saved);
    }, []);

    useEffect(() => {
        if (!cooldownRemaining) return;
        const interval = setInterval(() => {
            setCooldownRemaining(prev => {
                if (!prev || prev <= 1000) return null;
                return prev - 1000;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownRemaining]);

    const handleConnect = (address: string) => {
        setWalletAddress(address);
        localStorage.setItem('faucet_wallet_address', address);
    };

    const handleDisconnect = () => {
        setWalletAddress(null);
        localStorage.removeItem('faucet_wallet_address');
        setCooldownRemaining(null);
        setStatus(null);
    };

    const requestTokens = async () => {
        if (!walletAddress) {
            setShowAuthModal(true);
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch('/api/node/faucet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: walletAddress }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(typeof data === 'string' ? data : 'Failed to request tokens');

            const response: FaucetResponse = data;
            setStatus({
                type: 'success',
                message: `Success! You received ${response.amount} NCC tokens. TX: ${response.tx_hash.substring(0, 16)}...`
            });

            const now = Date.now();
            const cooldown = response.next_claim_time - now;
            if (cooldown > 0) setCooldownRemaining(cooldown);
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const formatCooldown = (ms: number) => {
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        return `${hours}h ${minutes}m`;
    };

    return (
        <>
            <div className="card text-center">
                <div className="text-6xl mb-4">💧</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Testnet Faucet</h3>
                <p className="text-gray-600 mb-6">Get free test tokens to try out the network</p>

                {walletAddress ? (
                    <div className="mb-6">
                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                            <span className="text-sm text-gray-600 block mb-1">Connected:</span>
                            <span className="font-mono text-sm text-gray-900">
                                {walletAddress.substring(0, 8)}...{walletAddress.substring(56)}
                            </span>
                        </div>
                        <button
                            className="text-sm text-red-600 hover:text-red-700"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        className="btn-primary w-full mb-6"
                        onClick={() => setShowAuthModal(true)}
                    >
                        🔗 Connect Wallet
                    </button>
                )}

                {walletAddress && (
                    <button
                        className="btn-primary w-full mb-4"
                        onClick={requestTokens}
                        disabled={loading || !!cooldownRemaining}
                    >
                        {loading ? (
                            <>
                                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Requesting...
                            </>
                        ) : cooldownRemaining ? (
                            `⏳ Cooldown: ${formatCooldown(cooldownRemaining)}`
                        ) : (
                            '💰 Get 1000 NCC'
                        )}
                    </button>
                )}

                {status && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 mb-4 ${status.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        <div className="text-xl">{status.type === 'success' ? '✓' : '⚠'}</div>
                        <div className="flex-1 text-sm text-left">{status.message}</div>
                    </div>
                )}

                <div className="text-sm text-gray-500">
                    ℹ️ You can request tokens once every 24 hours
                </div>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onConnect={handleConnect}
            />
        </>
    );
}
