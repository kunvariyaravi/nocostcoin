'use client';

import { useEffect, useState } from 'react';

interface NodeStats {
    peer_count: number;
}

export default function NodeStatus() {
    const [peerCount, setPeerCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/node/stats');
                if (!res.ok) throw new Error('Failed to fetch');
                const data: NodeStats = await res.json();
                setPeerCount(data.peer_count);
                setError(false);
            } catch (err) {
                setError(true);
                setPeerCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const isOnline = peerCount >= 3;

    if (loading) {
        return (
            <div className="card">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card bg-red-50 border-red-200">
                <div className="flex items-center gap-2 text-red-800">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <div className="font-semibold">Network Offline</div>
                        <div className="text-sm">
                            <strong>To start the testnet:</strong>
                            <code className="block mt-1 bg-red-100 px-2 py-1 rounded text-xs">.\launch_testnet.ps1</code>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`card ${isOnline ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className={`flex items-center gap-2 ${isOnline ? 'text-green-800' : 'text-yellow-800'}`}>
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <div>
                    <div className="font-semibold">
                        {isOnline ? 'Network Online' : `Insufficient Nodes (${peerCount}/3)`}
                    </div>
                    <div className="text-sm">
                        {isOnline ? `${peerCount} peers connected` : 'Waiting for more nodes...'}
                    </div>
                </div>
            </div>
        </div>
    );
}
