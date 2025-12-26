"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TransactionDetailsPage({ params }: { params: { hash: string } }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTx = async () => {
            try {
                const res = await fetch(`/api/node/transaction/${params.hash}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Transaction not found");
                    throw new Error("Failed to fetch transaction");
                }
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTx();
    }, [params.hash]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading transaction details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!data) return null;

    const { transaction, block_hash, status } = data;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/testnet/explorer" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors shadow-sm">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
            </div>

            <div className="card">
                <h2 className="text-lg font-bold mb-6 text-gray-800 border-b border-gray-100 pb-2">
                    Overview
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Transaction Hash</label>
                        <p className="font-mono text-sm text-gray-800 break-all select-all bg-gray-50 p-2 rounded border border-gray-100 mt-1">{params.hash}</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Status</label>
                            {status === 'confirmed' ? (
                                <span className="badge badge-success">Confirmed</span>
                            ) : (
                                <span className="badge badge-warning">Pending</span>
                            )}
                        </div>
                        {status === 'confirmed' && (
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Block</label>
                                <Link href={`/testnet/explorer/block/${block_hash}`} className="font-mono text-sm text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded">
                                    {block_hash}
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">From</label>
                            <Link href={`/testnet/explorer/address/${transaction.sender}`} className="block font-mono text-sm text-primary-600 hover:text-primary-700 break-all mt-1">
                                {transaction.sender}
                            </Link>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">To</label>
                            <Link href={`/testnet/explorer/address/${transaction.receiver}`} className="block font-mono text-sm text-primary-600 hover:text-primary-700 break-all mt-1">
                                {transaction.receiver}
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Amount</label>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {transaction.data.NativeTransfer?.amount || 0} <span className="text-sm text-gray-500 font-normal">NCC</span>
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Nonce</label>
                            <p className="text-lg font-mono text-gray-700 mt-1">{transaction.nonce}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Type</label>
                            <span className="badge badge-info mt-1">Native Transfer</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Signature</label>
                        <div className="mt-2 h-20 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-100 font-mono text-xs text-gray-500 break-all">
                            {JSON.stringify(transaction.signature)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
