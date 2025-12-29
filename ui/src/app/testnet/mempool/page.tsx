'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArchiveBoxIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toHex } from '@/utils/hex';

export default function MempoolPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMempool = async () => {
        try {
            const res = await fetch('/api/node/mempool');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMempool();
        const interval = setInterval(fetchMempool, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                        Mempool
                    </h1>
                    <p className="text-slate-400 mt-1">Pending transactions waiting to be included in a block.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <ArrowPathIcon className="w-4 h-4 animate-spin-slow" />
                    <span className="font-bold">{transactions.length}</span>
                    <span className="text-xs uppercase font-medium opacity-80">Pending</span>
                </div>
            </div>

            <div className="card overflow-hidden p-0 border-slate-700/50">
                {loading && transactions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">Loading mempool...</div>
                ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <ArchiveBoxIcon className="w-16 h-16 text-slate-700 mb-4" />
                        <h3 className="text-lg font-bold text-slate-400">Mempool is Empty</h3>
                        <p className="text-slate-500 text-sm mt-1">All transactions have been confirmed.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50">
                                <tr className="text-slate-500 text-xs font-medium uppercase tracking-wider border-b border-slate-700">
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Sender</th>
                                    <th className="px-6 py-4">Nonce</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {transactions.map((tx, i) => {
                                    const amount = tx.data.NativeTransfer?.amount || 0;
                                    const sender = toHex(tx.sender);

                                    return (
                                        <tr key={i} className="group hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    Pending
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-300">Native Transfer</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-blue-400 truncate max-w-[150px] block">
                                                    {sender.substring(0, 16)}...
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {tx.nonce}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-200">
                                                {amount} NCC
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
