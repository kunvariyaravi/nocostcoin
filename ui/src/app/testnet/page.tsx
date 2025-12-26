'use client';

import { useState, useEffect } from 'react';
import NodeStatus from '@/components/NodeStatus/NodeStatus';
import StatsCard from '@/components/StatsCard/StatsCard';

interface Stats {
    height: number;
    peer_count: number;
    balance: number;
}

export default function TestnetDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/node/stats');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setStats(data);
                setError(false);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Nocostcoin Testnet</h1>
                        <p className="text-lg text-gray-600">Test the world&apos;s first zero-fee blockchain with real transactions</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${!error && stats ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-gray-700">
                            {!error && stats ? 'Network Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="mb-8">
                    <NodeStatus />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatsCard
                        label="Block Height"
                        value={stats ? stats.height : '-'}
                    />
                    <StatsCard
                        label="Connected Peers"
                        value={stats ? stats.peer_count : '-'}
                    />
                    <StatsCard
                        label="My Balance"
                        value={stats ? stats.balance : '-'}
                        subValue="NCC"
                    />
                    <StatsCard
                        label="Block Time"
                        value="2s"
                    />
                </div>

                <div className="card">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">What is the Testnet?</h2>
                    <p className="text-gray-600 mb-6">
                        The Nocostcoin Testnet is a fully functional test network where you can experiment with
                        blockchain transactions without using real money. It&apos;s perfect for developers testing
                        applications or users learning how the network works.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl mb-2">💰</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Free Tokens</h3>
                            <p className="text-sm text-gray-600">Get test tokens from the faucet</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl mb-2">🔄</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Real Transactions</h3>
                            <p className="text-sm text-gray-600">Send and receive like the mainnet</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl mb-2">🔍</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Explore Blocks</h3>
                            <p className="text-sm text-gray-600">View all network activity</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
