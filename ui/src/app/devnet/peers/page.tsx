'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface PeerInfo {
    id: string;
    height: number;
}

export default function Peers() {
    const [peers, setPeers] = useState<PeerInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPeers = async () => {
            try {
                const res = await fetch('/api/node/peers');
                if (res.ok) {
                    const data = await res.json();
                    setPeers(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPeers();
        const interval = setInterval(fetchPeers, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Connected Peers</h1>
                <p className={styles.subtitle}>Nodes currently connected to this node</p>
            </div>

            <div className={styles.list}>
                {loading && peers.length === 0 ? (
                    <div className={styles.empty}>Loading peers...</div>
                ) : peers.length > 0 ? (
                    peers.map((peer) => (
                        <div key={peer.id} className={styles.peerCard}>
                            <div className={styles.peerInfo}>
                                <span className={styles.peerId}>{peer.id}</span>
                                <span className={styles.peerHeight}>Height: {peer.height}</span>
                            </div>
                            <div className={styles.status}>
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: '#00ff88',
                                    boxShadow: '0 0 10px rgba(0,255,136,0.5)'
                                }} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.empty}>No peers connected</div>
                )}
            </div>
        </main>
    );
}
