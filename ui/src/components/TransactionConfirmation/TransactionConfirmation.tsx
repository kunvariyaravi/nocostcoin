'use client';

import { useState } from 'react';
import {
    ExclamationTriangleIcon,
    XMarkIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

export interface TransactionData {
    from: string;
    to: string;
    amount: number;
    fee?: number;
}

interface TransactionConfirmationProps {
    isOpen: boolean;
    transaction: TransactionData | null;
    onConfirm: (password?: string) => Promise<void>;
    onCancel: () => void;
    requirePassword?: boolean;
}

export default function TransactionConfirmation({
    isOpen,
    transaction,
    onConfirm,
    onCancel,
    requirePassword = false,
}: TransactionConfirmationProps) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !transaction) return null;

    const isHighValue = transaction.amount > 1000;
    const needsPassword = requirePassword || isHighValue;

    const handleConfirm = async () => {
        setError('');

        if (needsPassword && !password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);

        try {
            await onConfirm(needsPassword ? password : undefined);
            setPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setPassword('');
        setError('');
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Confirm Transaction</h2>
                    <button
                        onClick={handleCancel}
                        className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-lg"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Transaction Details */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <span className="text-slate-400 text-sm">From</span>
                            <span className="text-white text-sm font-mono text-right break-all ml-4">
                                {transaction.from.slice(0, 10)}...{transaction.from.slice(-10)}
                            </span>
                        </div>

                        <div className="h-px bg-slate-700" />

                        <div className="flex justify-between items-start">
                            <span className="text-slate-400 text-sm">To</span>
                            <span className="text-white text-sm font-mono text-right break-all ml-4">
                                {transaction.to.slice(0, 10)}...{transaction.to.slice(-10)}
                            </span>
                        </div>

                        <div className="h-px bg-slate-700" />

                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Amount</span>
                            <span className="text-emerald-400 text-lg font-bold">
                                {transaction.amount.toLocaleString()} NCC
                            </span>
                        </div>

                        {transaction.fee !== undefined && (
                            <>
                                <div className="h-px bg-slate-700" />
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Network Fee</span>
                                    <span className="text-slate-300 text-sm">
                                        {transaction.fee.toLocaleString()} NCC
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="h-px bg-slate-700" />

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-white font-medium">Total</span>
                            <span className="text-white text-lg font-bold">
                                {(transaction.amount + (transaction.fee || 0)).toLocaleString()} NCC
                            </span>
                        </div>
                    </div>

                    {/* High Value Warning */}
                    {isHighValue && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-3">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-200">
                                <p className="font-medium mb-1">High-Value Transaction</p>
                                <p className="text-amber-300/80">
                                    This transaction is over 1,000 NCC. Please verify the recipient address carefully.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Password Input (if needed) */}
                    {needsPassword && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm with Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                                placeholder="Enter your password"
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success Instructions */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-start gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-emerald-200">
                            Once confirmed, this transaction will be broadcast to the network and cannot be reversed.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 border-t border-slate-700">
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || (needsPassword && !password)}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Confirming...' : 'Confirm & Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}
