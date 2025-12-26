"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Block {
    hash: string;
    header: {
        slot: number;
        timestamp: number;
        validator_pubkey: number[];
        parent_hash: string;
    };
    transactions: any[];
}

interface Transaction {
    sender: string;
    receiver: string;
    amount: number;
    nonce: number;
    signature: number[];
}

export default function ExplorerPage() {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [mempool, setMempool] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [blocksRes, mempoolRes] = await Promise.all([
                    fetch('/api/node/blocks?limit=10'),
                    fetch('/api/node/mempool')
                ]);

                if (blocksRes.ok) {
                    const blocksData = await blocksRes.json();
                    setBlocks(blocksData);
                }

                if (mempoolRes.ok) {
                    const mempoolData = await mempoolRes.json();
                    setMempool(mempoolData);
                }
            } catch (error) {
                console.error('Failed to fetch explorer data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Auto-refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        // Try to identify type
        if (query.length === 64) {
            // 64 chars could be Block Hash, Tx Hash, or Address (hex version)
            // Let's try to fetch as Tx first? Or let's assume if it fails one, try another.
            // Best UX: Redirect to a search results page? 
            // Simpler: Just blindly redirect to Transaction page if the user thinks it's a Tx, or Block if Block.
            // Let's check if it exists as a block first via API?

            try {
                const blockRes = await fetch(`/api/node/block/${query}`);
                if (blockRes.ok) {
                    router.push(`/testnet/explorer/block/${query}`);
                    return;
                }

                const txRes = await fetch(`/api/node/transaction/${query}`);
                if (txRes.ok) {
                    router.push(`/testnet/explorer/tx/${query}`);
                    return;
                }

                // If neither, maybe address?
                const accRes = await fetch(`/api/node/account/${query}`);
                if (accRes.ok && accRes.status !== 404) {
                    router.push(`/testnet/explorer/address/${query}`);
                    return;
                }

            } catch (e) {
                // ignore
            }

            // If all checks fail or network error, fallback to address if it looks like one purely by format?
            // Or just show error?
            alert("Could not find Block, Transaction, or Account with that hash/ID.");

        } else {
            alert("Please enter a valid 64-character Hex Hash or Address");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gradient">Blockchain Explorer</h1>
                    <p className="text-gray-500 mt-1">Real-time block and transaction insights</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search Hash / Address..."
                        className="input w-full md:w-96 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="btn-primary">
                        Search
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Latest Blocks */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">📦</span> Latest Blocks
                    </h2>

                    {loading && blocks.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">Loading blocks...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 text-sm font-medium">
                                        <th className="pb-3 pl-2">Height</th>
                                        <th className="pb-3">Hash</th>
                                        <th className="pb-3">Time</th>
                                        <th className="pb-3 pr-2 text-right">Txs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {blocks.map((block) => (
                                        <tr key={block.hash} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-4 pl-2">
                                                <span className="bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded text-sm">#{block.header.slot}</span>
                                            </td>
                                            <td className="py-4">
                                                <Link href={`/testnet/explorer/block/${block.hash}`} className="text-primary-600 hover:text-primary-700 font-mono text-sm truncate block max-w-[120px]">
                                                    {block.hash.substring(0, 8)}...
                                                </Link>
                                            </td>
                                            <td className="py-4 text-gray-500 text-sm">
                                                {new Date(block.header.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="py-4 pr-2 text-right text-gray-600 font-medium">
                                                {block.transactions.length}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Latest Transactions (Mempool) */}
                <div className="card">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                        <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">⏳</span> Pending Transactions
                    </h2>

                    {loading && mempool.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">Loading mempool...</div>
                    ) : mempool.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                            No pending transactions
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 text-sm font-medium">
                                        <th className="pb-3 pl-2">From</th>
                                        <th className="pb-3">To</th>
                                        <th className="pb-3 pr-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {mempool.slice(0, 10).map((tx, i) => (
                                        <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-4 pl-2">
                                                <Link href={`/testnet/explorer/address/${tx.sender}`} className="text-gray-600 hover:text-primary-600 font-mono text-sm truncate block max-w-[100px]">
                                                    {tx.sender.substring(0, 6)}...
                                                </Link>
                                            </td>
                                            <td className="py-4">
                                                <Link href={`/testnet/explorer/address/${tx.receiver}`} className="text-gray-600 hover:text-primary-600 font-mono text-sm truncate block max-w-[100px]">
                                                    {tx.receiver.substring(0, 6)}...
                                                </Link>
                                            </td>
                                            <td className="py-4 pr-2 text-right text-emerald-600 font-bold">
                                                {tx.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
