'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MempoolPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMempool = async () => {
        try {
            const res = await fetch('/api/node/mempool');
            if (res.ok) {
                const data = await res.json();
                // Data from backend is List<Transaction>. 
                // We might need to map it if structure differs, but typically it maps directly.
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
        const interval = setInterval(fetchMempool, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Mempool</h1>
                        <p className="text-gray-500 mt-1">Real-time pending transactions waiting for confirmation</p>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Count</span>
                        <p className="text-3xl font-bold text-primary-600">{transactions.length}</p>
                    </div>
                </div>

                <div className="card">
                    {loading && transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">Loading mempool...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                            <span className="text-4xl block mb-2">🍃</span>
                            <p className="text-gray-500 font-medium">Mempool is empty</p>
                            <p className="text-sm text-gray-400">All transactions have been confirmed.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 text-sm font-medium">
                                        <th className="pb-3 pl-4">Type</th>
                                        <th className="pb-3">Sender</th>
                                        <th className="pb-3">Receiver / Info</th>
                                        <th className="pb-3 text-right pr-4">Amount / Fee</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.map((tx, i) => {
                                        // Determine Type
                                        let type = "Unknown";
                                        let info = null;
                                        let amount = 0;
                                        const hash = Buffer.from(tx.signature).toString('hex').substring(0, 16); // Fallback hash

                                        if (tx.data.NativeTransfer) {
                                            type = "Transfer";
                                            amount = tx.data.NativeTransfer.amount;
                                            info = <Link href={`/testnet/explorer/address/${tx.receiver}`} className="font-mono hover:text-primary-600">{tx.receiver.substring(0, 8)}...{tx.receiver.substring(60)}</Link>;
                                        } else if (tx.data.RegisterValidator) {
                                            type = "Validator Reg";
                                            amount = tx.data.RegisterValidator.stake;
                                            info = <span className="text-gray-500 italic">Staking to Network</span>;
                                        }

                                        return (
                                            <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <span className={`badge ${type === 'Transfer' ? 'badge-info' : 'badge-warning'}`}>
                                                        {type}
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    <Link href={`/testnet/explorer/address/${tx.sender}`} className="font-mono text-sm text-gray-600 hover:text-primary-600">
                                                        {tx.sender.substring(0, 8)}...
                                                    </Link>
                                                    <div className="text-xs text-gray-400 mt-0.5">Nonce: {tx.nonce}</div>
                                                </td>
                                                <td className="py-4 text-sm text-gray-600">
                                                    {info}
                                                </td>
                                                <td className="py-4 pr-4 text-right">
                                                    <div className="font-bold text-gray-900">{amount > 0 ? `${amount} NCC` : '-'}</div>
                                                    <div className="text-xs text-gray-400">Fee: 0 (Nocost)</div>
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
        </main>
    );
}
