"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AddressDetailsPage({ params }: { params: { address: string } }) {
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await fetch(`/api/node/account/${params.address}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        // Account not found often means 0 balance/new account.
                        setAccount({ address: params.address, balance: 0, nonce: 0 });
                        return;
                    }
                    throw new Error("Failed to fetch account");
                }
                const data = await res.json();
                setAccount(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, [params.address]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading address details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!account) return null;

    return (
        <div className="space-y-8 animate-in fly-in-bottom duration-500">
            <div className="flex items-center gap-4">
                <Link href="/testnet/explorer" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors shadow-sm">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Address Details</h1>
            </div>

            <div className="card shadow-xl border-primary-100 bg-gradient-to-br from-white to-primary-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 space-y-8 p-2">
                    <div>
                        <label className="text-sm text-gray-500 font-medium uppercase tracking-wider">Address</label>
                        <p className="font-mono text-lg md:text-xl text-gray-900 break-all mt-2 select-all bg-white/60 p-3 rounded-lg border border-primary-100 shadow-sm">
                            {account.address}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-primary-100">
                        <div>
                            <label className="text-sm text-gray-500 font-medium uppercase tracking-wider">Balance</label>
                            <p className="text-4xl font-bold text-gray-900 mt-2">
                                {account.balance.toLocaleString()} <span className="text-lg text-primary-600 font-medium">NCC</span>
                            </p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-500 font-medium uppercase tracking-wider">Nonce</label>
                            <p className="text-4xl font-bold text-gray-900 mt-2">
                                {account.nonce}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction History Section */}
            <div className="card">
                <h2 className="text-lg font-bold mb-6 text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                    <span className="p-1 bg-gray-100 rounded text-gray-500 text-sm">📜</span> Transaction History
                </h2>
                <TransactionHistoryList address={params.address} />
            </div>
        </div>
    );
}

function TransactionHistoryList({ address }: { address: string }) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/node/account/${address}/history`);
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [address]);

    if (loading && history.length === 0) return <div className="text-center py-8 text-gray-400">Loading history...</div>;
    if (history.length === 0) return <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">No transactions found</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider font-medium">
                        <th className="pb-3 pl-4">Type</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Involved Address</th>
                        <th className="pb-3 text-right pr-4">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {history.map((item, i) => {
                        const isSender = item.transaction.sender === address;
                        const type = isSender ? 'OUT' : 'IN';
                        const color = isSender ? 'badge-warning' : 'badge-success';
                        const sign = isSender ? '-' : '+';
                        const otherAddr = isSender ? item.transaction.receiver : item.transaction.sender;

                        return (
                            <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-4">
                                    <span className={`badge ${color} text-xs`}>
                                        {type}
                                    </span>
                                </td>
                                <td className="py-4">
                                    {item.status === 'confirmed' ? (
                                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">Confirmed</span>
                                    ) : (
                                        <span className="text-xs text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded">Pending</span>
                                    )}
                                </td>
                                <td className="py-4">
                                    <Link href={`/testnet/explorer/address/${otherAddr}`} className="font-mono text-sm text-gray-600 hover:text-primary-600 transition-colors">
                                        {otherAddr.substring(0, 8)}...{otherAddr.substring(otherAddr.length - 8)}
                                    </Link>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Tx: <Link href={`/testnet/explorer/tx/${item.hash}`} className="hover:underline">{item.hash.substring(0, 10)}...</Link>
                                    </div>
                                </td>
                                <td className={`py-4 pr-4 text-right font-bold font-mono ${isSender ? 'text-gray-900' : 'text-emerald-600'}`}>
                                    {sign} {item.transaction.data.NativeTransfer?.amount}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
