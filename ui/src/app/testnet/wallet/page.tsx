'use client';

import { useState, useEffect } from 'react';
import {
    CreditCardIcon,
    DocumentDuplicateIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { toHex } from '@/utils/hex';

export default function WalletPage() {
    const [address, setAddress] = useState<string>('');
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const fetchWalletInfo = async () => {
        try {
            // Get stats to find address
            const statsRes = await fetch('/api/node/stats');
            if (!statsRes.ok) return;
            const stats = await statsRes.json();
            setAddress(stats.address);

            // Get balance
            const accountRes = await fetch(`/api/node/account/${stats.address}`);
            if (accountRes.ok) {
                const account = await accountRes.json();
                setBalance(account.balance);
            }
        } catch (e) {
            console.error("Connection error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletInfo();
        const interval = setInterval(fetchWalletInfo, 5000);
        return () => clearInterval(interval);
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white">My Wallet</h1>

            {/* Balance Card */}
            <div className="grid grid-cols-1 gap-8">
                <div className="card relative overflow-hidden group border-slate-700/50 bg-slate-800/30">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <CreditCardIcon className="w-64 h-64 rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <p className="text-slate-400 font-medium mb-1">Total Balance</p>
                            <h2 className="text-5xl font-bold text-white tracking-tight">
                                {loading ? '...' : balance.toLocaleString()}
                                <span className="text-2xl text-slate-500 ml-2">NCC</span>
                            </h2>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm md:min-w-[400px]">
                            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-bold">Wallet Address</p>
                            <div className="flex items-center gap-3">
                                <code className="text-sm text-blue-300 font-mono break-all">{address || 'Loading...'}</code>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                                    title="Copy Address"
                                >
                                    {copied ? <CheckIcon className="w-5 h-5 text-emerald-500" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="card h-[600px] border-slate-700/50 bg-slate-800/30">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Transaction History</h3>
                        <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                            <span className="text-xs text-slate-400">Auto-refreshing</span>
                        </div>
                    </div>
                    <TransactionHistoryList address={address} />
                </div>
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
            // Only set loading on first fetch to avoid flickering
            if (history.length === 0) setLoading(true);
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
        const interval = setInterval(fetchHistory, 5000);
        return () => clearInterval(interval);
    }, [address]);

    if (loading && history.length === 0) return <div className="text-center py-12 text-slate-500">Loading history...</div>;
    if (history.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <DocumentDuplicateIcon className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-medium">No transactions found</p>
        </div>
    );

    return (
        <div className="overflow-x-auto h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur z-10">
                    <tr className="text-slate-500 text-xs font-medium uppercase tracking-wider border-b border-slate-700">
                        <th className="pb-4 pl-4">Type</th>
                        <th className="pb-4">Transaction Details</th>
                        <th className="pb-4 text-right pr-4">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {history.map((item, i) => {
                        const isSender = item.transaction.sender === address;
                        const type = isSender ? 'Sent' : 'Received';
                        const color = isSender ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                        const sign = isSender ? '-' : '+';
                        const txHash = item.hash || toHex(item.transaction.signature);

                        // Parse sender/receiver from raw tx if needed, or use history item context
                        const otherAddress = isSender ? item.transaction.receiver : item.transaction.sender;

                        return (
                            <tr key={i} className="group hover:bg-slate-800/50 transition-colors">
                                <td className="py-4 pl-4 align-top w-[100px]">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${color} inline-block text-center w-full`}>
                                        {type}
                                    </span>
                                </td>
                                <td className="py-4 align-top">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 text-xs">Hash:</span>
                                            <span className="font-mono text-xs text-blue-400 hover:text-blue-300 cursor-pointer break-all">
                                                {txHash}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500 text-xs">{isSender ? 'To:' : 'From:'}</span>
                                            <span className="font-mono text-xs text-slate-400 break-all">
                                                {toHex(otherAddress)}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className={`py-4 pr-4 text-right align-top text-lg font-bold ${isSender ? 'text-slate-300' : 'text-emerald-400'}`}>
                                    {sign}{item.transaction.data.NativeTransfer?.amount} NCC
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
