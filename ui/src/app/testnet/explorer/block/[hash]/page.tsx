'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    CubeIcon,
    ArrowLeftIcon,
    ClockIcon,
    CheckBadgeIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toHex } from '@/utils/hex';

interface Transaction {
    sender: string; // hex
    receiver: string; // hex
    nonce: number;
    data: {
        NativeTransfer?: { amount: number };
        CreateAsset?: any;
        // ... other types
    };
    signature: any; // hex/bytes
}

interface Block {
    hash: string;
    header: {
        slot: number;
        epoch: number;
        timestamp: number;
        parent_hash: string;
        validator_pubkey: number[];
        state_root: string;
        vrf_proof: number[];
    };
    transactions: Transaction[];
}

export default function BlockDetailsPage({ params }: { params: { hash: string } }) {
    const [block, setBlock] = useState<Block | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                const res = await fetch(`/api/node/block/${params.hash}`);
                if (res.ok) {
                    const data = await res.json();
                    setBlock(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchBlock();
    }, [params.hash]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading block details...</div>;
    if (!block) return <div className="p-8 text-center text-slate-500">Block not found</div>;

    const validator = toHex(block.header.validator_pubkey);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <Link href="/testnet/explorer" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back to Explorer
            </Link>

            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <CubeIcon className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Block #{block.header.slot}</h1>
                    <p className="text-slate-400 font-mono text-sm">{block.hash}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Details Card */}
                <div className="card space-y-6">
                    <h3 className="font-bold text-slate-200 border-b border-slate-700/50 pb-2">Block Header</h3>

                    <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-500">Timestamp</span>
                            <span className="text-slate-300 flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                {new Date(block.header.timestamp).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-500">Epoch</span>
                            <span className="text-slate-300">{block.header.epoch}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-500">Parent Hash</span>
                            <span className="text-blue-400 font-mono truncate max-w-[200px]" title={block.header.parent_hash}>
                                {block.header.parent_hash.substring(0, 16)}...
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-800">
                            <span className="text-slate-500">State Root</span>
                            <span className="text-slate-300 font-mono truncate max-w-[200px]">
                                {block.header.state_root || 'None'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 py-2">
                            <span className="text-slate-500">Validator</span>
                            <div className="flex items-center gap-2">
                                <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 font-mono text-xs break-all">{validator}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Card */}
                <div className="card">
                    <h3 className="font-bold text-slate-200 border-b border-slate-700/50 pb-2 mb-4 flex justify-between items-center">
                        <span>Transactions</span>
                        <span className="text-xs font-normal bg-slate-700 px-2 py-1 rounded text-slate-300">{block.transactions.length}</span>
                    </h3>

                    {block.transactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            No transactions in this block
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {block.transactions.map((tx, i) => {
                                // Calculate simple hash or ID from signature if needed since API might not send full hash
                                // The API update in core/src/api.rs was "TransactionResponse" but block returns "Block" which contains raw "Transaction" struct
                                // "Transaction" struct defaults don't have hash string.
                                // We'll just show partial sender/receiver.

                                const sender = toHex(tx.sender);
                                const receiver = toHex(tx.receiver);
                                const amount = tx.data.NativeTransfer?.amount || 0;

                                return (
                                    <div key={i} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Native Transfer</span>
                                            <span className="text-sm font-bold text-white">{amount} NCC</span>
                                        </div>
                                        <div className="space-y-1 text-xs font-mono">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">From</span>
                                                <span className="text-slate-400 truncate max-w-[150px]">{sender}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">To</span>
                                                <span className="text-slate-400 truncate max-w-[150px]">{receiver}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
