"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BlockDetailsPage({ params }: { params: { hash: string } }) {
    const [block, setBlock] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                const res = await fetch(`/api/node/block/${params.hash}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Block not found");
                    throw new Error("Failed to fetch block");
                }
                const data = await res.json();
                setBlock(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBlock();
    }, [params.hash]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading block details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!block) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/testnet/explorer" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors shadow-sm">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Block <span className="text-gray-400">#{block.header.slot}</span></h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Block Info Card */}
                <div className="card">
                    <h2 className="text-lg font-bold mb-4 text-primary-600 flex items-center gap-2">
                        🔍 Header Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Hash</label>
                            <p className="font-mono text-sm text-gray-800 break-all select-all bg-gray-50 p-2 rounded border border-gray-100 mt-1">{block.hash}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Parent Hash</label>
                            <Link href={`/testnet/explorer/block/${block.header.parent_hash}`} className="block font-mono text-sm text-primary-600 hover:text-primary-700 break-all bg-primary-50 p-2 rounded border border-primary-100 mt-1 transition-colors">
                                {block.header.parent_hash}
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Timestamp</label>
                                <p className="text-gray-900 font-medium">{new Date(block.header.timestamp).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</label>
                                <span className="badge badge-success mt-1">Finalized</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Details Card */}
                <div className="card">
                    <h2 className="text-lg font-bold mb-4 text-purple-600 flex items-center gap-2">
                        ⚙️ Consensus Details
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Proposer</label>
                            <p className="font-mono text-xs text-gray-600 break-all mt-1 p-2 bg-gray-50 rounded border border-gray-100">
                                {block.header.validator_pubkey ?
                                    Buffer.from(block.header.validator_pubkey).toString('hex') : 'Genesis'}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">State Root</label>
                            <p className="font-mono text-xs text-gray-600 break-all mt-1">{block.header.state_root || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">VRF Output</label>
                            <p className="font-mono text-xs text-gray-500 break-all truncate mt-1">{block.header.vrf_output ? 'Present' : 'None'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                    <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-700 text-sm">{block.transactions.length}</span> Transactions
                </h2>

                {block.transactions.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                        No transactions in this block
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider font-medium">
                                    <th className="pb-3 pl-4">Type</th>
                                    <th className="pb-3">Sender</th>
                                    <th className="pb-3">Receiver</th>
                                    <th className="pb-3 pr-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {block.transactions.map((tx: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 pl-4">
                                            <span className="badge badge-info text-xs">
                                                Transfer
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <Link href={`/testnet/explorer/address/${tx.sender}`} className="font-mono text-sm text-gray-600 hover:text-primary-600 transition-colors">
                                                {tx.sender.substring(0, 12)}...
                                            </Link>
                                        </td>
                                        <td className="py-4">
                                            <Link href={`/testnet/explorer/address/${tx.receiver}`} className="font-mono text-sm text-gray-600 hover:text-primary-600 transition-colors">
                                                {tx.receiver.substring(0, 12)}...
                                            </Link>
                                        </td>
                                        <td className="py-4 pr-4 text-right">
                                            <span className="text-emerald-600 font-bold font-mono">{tx.amount} NCC</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
