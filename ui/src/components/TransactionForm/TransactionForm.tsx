'use client';

import { useState } from 'react';

interface TransactionFormProps {
    userAddress: string;
}

export default function TransactionForm({ userAddress }: TransactionFormProps) {
    const [receiver, setReceiver] = useState('7039fbf98b3a0d25f2eb2d4805d52dc0b1ee122df0ea839fa8a90c308f0892e6');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<null | { type: 'success' | 'error', message: string }>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        // Validate that receiver is not the same as sender
        if (receiver.toLowerCase() === userAddress.toLowerCase()) {
            setStatus({ type: 'error', message: 'Cannot send tokens to yourself. Please enter a different address.' });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/node/transaction/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver,
                    amount: parseInt(amount),
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data || 'Failed to send transaction');

            setStatus({
                type: 'success',
                message: `Transaction sent successfully! Hash: ${data.substring(0, 16)}...`
            });
            setReceiver('');
            setAmount('');
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(userAddress);
        setStatus({ type: 'success', message: 'Your address copied to clipboard!' });
        setTimeout(() => setStatus(null), 2000);
    };

    return (
        <div className="card">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Send Transaction</h3>
                <p className="text-gray-600">Transfer NCC tokens to another address with zero fees</p>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Your Wallet Address</span>
                    <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        onClick={copyAddress}
                        title="Copy address"
                    >
                        📋 Copy
                    </button>
                </div>
                <div className="font-mono text-sm text-blue-900 break-all">
                    {userAddress}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                    Share this address to receive tokens from others
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Receiver Address
                    </label>
                    <input
                        className="input"
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="e.g., 7039fbf98b3a0d25f2eb2d4805d52dc0b1ee122df0ea839fa8a90c308f0..."
                        required
                    />
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">
                            💡 <strong>How to get a receiver address:</strong>
                        </p>
                        <ul className="text-xs text-gray-600 space-y-1 ml-4">
                            <li>• Ask the recipient to share their wallet address</li>
                            <li>• They can copy it from their wallet page</li>
                            <li>• Or scan their QR code if meeting in person</li>
                        </ul>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Send
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            className="input pr-16"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            required
                            min="1"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            NCC
                        </span>
                    </div>
                    <span className="text-xs text-green-600 mt-1 block">
                        💰 Zero fees - you pay exactly what you send!
                    </span>
                </div>

                <button
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Sending...
                        </>
                    ) : (
                        '→ Send Transaction'
                    )}
                </button>

                {status && (
                    <div className={`p-4 rounded-lg flex items-start gap-3 ${status.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        <div className="text-xl">
                            {status.type === 'success' ? '✓' : '⚠'}
                        </div>
                        <div className="flex-1 text-sm">{status.message}</div>
                    </div>
                )}
            </form>
        </div>
    );
}
