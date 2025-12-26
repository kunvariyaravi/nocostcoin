'use client';

import { useState, useEffect } from 'react';

interface Peer {
    id: string;
    address: string;
    height: number;
}

export default function PeersPage() {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeers = async () => {
            try {
                const res = await fetch('/api/node/peers');
                if (res.ok) {
                    const data = await res.json();
                    setPeers(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchPeers();
        const interval = setInterval(fetchPeers, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Network Peers</h1>
                <p className="text-lg text-gray-600 mb-8">Connected nodes in the testnet</p>

                <div className="card">
                    <div className="mb-4">
                        <span className="text-sm text-gray-600">Total Peers: </span>
                        <span className="text-lg font-semibold text-gray-900">{peers.length}</span>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : peers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No peers connected
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {peers.map((peer) => (
                                <div key={peer.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Peer ID</div>
                                            <div className="font-mono text-sm text-gray-900">{peer.id.substring(0, 16)}...</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Address</div>
                                            <div className="font-mono text-sm text-gray-900">{peer.address}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Block Height</div>
                                            <div className="text-sm font-semibold text-gray-900">{peer.height.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
