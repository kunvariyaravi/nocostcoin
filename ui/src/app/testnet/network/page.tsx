'use client';

import { useState, useEffect } from 'react';
import { GlobeAltIcon, ServerIcon, SignalIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Peer {
    id: string;
    address: string | null;
    height: number;
    protocol: string | null;
}

export default function NetworkPage() {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [loading, setLoading] = useState(true);
    const [localNodeOnline, setLocalNodeOnline] = useState(false);
    const [vpsNodeOnline, setVpsNodeOnline] = useState(false);

    // Check if user has a local node running
    const checkLocalNode = async () => {
        try {
            const res = await fetch('http://localhost:8000/stats', {
                method: 'GET',
                mode: 'cors'
            });
            setLocalNodeOnline(res.ok);
        } catch (e) {
            setLocalNodeOnline(false);
        }
    };

    // Fetch peers from VPS node
    const fetchPeers = async () => {
        try {
            const res = await fetch('/api/node/peers');
            if (res.ok) {
                const data = await res.json();
                setPeers(data);
                setVpsNodeOnline(true);
            } else {
                setVpsNodeOnline(false);
            }
        } catch (e) {
            console.error(e);
            setVpsNodeOnline(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkLocalNode();
        fetchPeers();
        const interval = setInterval(() => {
            checkLocalNode();
            fetchPeers();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">
                        Network
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Your local node and network peers.
                    </p>
                </div>
                {vpsNodeOnline ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-slate-300">{peers.length} network peers</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/20 border border-red-900/30">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium text-red-400">Network Offline</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Local Node Card - Always shown first */}
                <div className={`card ${localNodeOnline ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-700/50'} relative overflow-hidden transition-colors duration-300`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <GlobeAltIcon className={`w-24 h-24 ${localNodeOnline ? 'text-blue-400' : 'text-slate-700'}`} />
                    </div>
                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${localNodeOnline ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                            {localNodeOnline ? <ServerIcon className="w-6 h-6" /> : <ExclamationTriangleIcon className="w-6 h-6" />}
                        </div>
                        <h3 className="text-lg font-bold text-white">Your Node</h3>
                        <p className="text-sm text-slate-400 mb-4">localhost:8000</p>

                        {localNodeOnline ? (
                            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit">
                                <SignalIcon className="w-3 h-3" />
                                Online
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded w-fit">
                                    <SignalIcon className="w-3 h-3" />
                                    Not Running
                                </div>
                                <p className="text-xs text-slate-600">
                                    Start a local node to see it here
                                </p>
                                <a
                                    href="/blog/how-to-run-node"
                                    target="_blank"
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                                >
                                    Read Setup Guide &rarr;
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* VPS/Bootstrap Node */}
                <div className={`card ${vpsNodeOnline ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-700/50'} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <GlobeAltIcon className="w-24 h-24 text-emerald-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${vpsNodeOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                                <ServerIcon className="w-6 h-6" />
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                Bootstrap
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">Public Node</h3>
                        <p className="text-sm text-slate-400 mb-4">72.62.167.94:9000</p>

                        {vpsNodeOnline ? (
                            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit">
                                <SignalIcon className="w-3 h-3" />
                                Online
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded w-fit">
                                <SignalIcon className="w-3 h-3" />
                                Offline
                            </div>
                        )}
                    </div>
                </div>



                {/* Network Peers */}
                {peers.map((peer) => (
                    <div key={peer.id} className="card border-slate-700/50 hover:border-slate-600 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-400">
                                <ServerIcon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                Height: {peer.height}
                            </span>
                        </div>

                        <h4 className="font-bold text-slate-200 text-sm mb-1 truncate" title={peer.id}>
                            Peer {peer.id.substring(0, 8)}...
                        </h4>

                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Address</span>
                                <span className="text-slate-400 font-mono truncate max-w-[150px]">{peer.address || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Protocol</span>
                                <span className="text-blue-400">{peer.protocol || '/nocostcoin/1.0.0'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {peers.length === 0 && !loading && vpsNodeOnline && (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                    <GlobeAltIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400">No additional peers connected</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                        The network is currently bootstrapping. More peers will appear as they join.
                    </p>
                </div>
            )}
        </div>
    );
}
