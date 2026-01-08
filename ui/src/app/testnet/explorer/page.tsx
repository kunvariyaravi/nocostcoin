'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    CubeIcon,
    HashtagIcon,
    ClockIcon,
    ArrowRightIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { toHex } from '@/utils/hex';

interface Block {
    hash: string;
    header: {
        slot: number;
        epoch: number;
        timestamp: number;
        parent_hash: string;
        validator_pubkey: number[];
    };
    transactions: any[];
}

export default function ExplorerPage() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchBlocks = async () => {
        try {
            // Fetch last 20 blocks with cache busting
            const res = await fetch('/api/node/blocks?limit=20', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setBlocks(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlocks();
        const interval = setInterval(fetchBlocks, 3000);
        return () => clearInterval(interval);
    }, []);

    const filteredBlocks = blocks.filter(b =>
        b.hash.toLowerCase().includes(search.toLowerCase()) ||
        b.header.slot.toString().includes(search)
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                        Block Explorer
                    </h1>
                    <p className="text-slate-400 mt-1">View real-time blocks and network activity.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by Block Hash or Slot..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10 bg-slate-900 border-slate-700 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="card overflow-hidden p-0 border-slate-700/50">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/50">
                            <tr className="text-slate-500 text-xs font-medium uppercase tracking-wider border-b border-slate-700">
                                <th className="px-6 py-4">Slot</th>
                                <th className="px-6 py-4">Block Hash</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Transactions</th>
                                <th className="px-6 py-4">Validator</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading && blocks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading blocks...</td>
                                </tr>
                            ) : filteredBlocks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No blocks found</td>
                                </tr>
                            ) : (
                                filteredBlocks.map((block) => {
                                    // Handle future timestamps due to VPS offset
                                    let timeAgo = Math.floor((Date.now() - block.header.timestamp) / 1000);
                                    if (timeAgo < 0) timeAgo = 0; // Clamp explicit future timestamps

                                    let timeString = `${timeAgo}s ago`;
                                    if (timeAgo > 60) timeString = `${Math.floor(timeAgo / 60)}m ago`;

                                    const validator = toHex(block.header.validator_pubkey).substring(0, 8) + '...';

                                    return (
                                        <tr key={block.hash} className="group hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <CubeIcon className="w-4 h-4 text-blue-500" />
                                                    <span className="font-bold text-blue-400">{block.header.slot}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-slate-400">{block.hash.substring(0, 16)}...</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                    <ClockIcon className="w-4 h-4" />
                                                    {timeString}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${block.transactions.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                    {block.transactions.length} txs
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-400">
                                                {validator}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/testnet/explorer/block/${block.hash}`} className="p-2 rounded hover:bg-slate-700 inline-block text-slate-500 hover:text-white transition-colors">
                                                    <ArrowRightIcon className="w-5 h-5" />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
