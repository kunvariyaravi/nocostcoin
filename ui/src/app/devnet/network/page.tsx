'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { motion } from 'framer-motion';

interface Peer {
    id: string;
    height: number;
    address?: string;
    protocol?: string;
    latency?: number;
}

export default function NetworkPage() {
    const [peers, setPeers] = useState<Peer[]>([]);
    const [selectedPeer, setSelectedPeer] = useState<Peer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchPeers = async () => {
            try {
                const res = await fetch('/api/node/peers');
                const data = await res.json();
                setPeers(data);
            } catch (error) {
                console.error('Failed to fetch peers', error);
            }
        };

        fetchPeers();
        const interval = setInterval(fetchPeers, 5000);
        return () => clearInterval(interval);
    }, []);

    // Calculate positions in a circle
    const centerX = 300; // Half of container height/width roughly if responsive but fixed for sim simplicity
    const centerY = 300;
    const radius = 200;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Network Visualizer</h1>
                <p style={{ color: '#888' }}>Real-time P2P Mesh Topology</p>
            </header>

            <div className={styles.vizContainer} ref={containerRef}>
                <svg className={styles.connection}>
                    {peers.map((peer, i) => {
                        const angle = (i / peers.length) * 2 * Math.PI;
                        const x = centerX + radius * Math.cos(angle);
                        const y = centerY + radius * Math.sin(angle);

                        return (
                            <g key={`conn-${peer.id}`}>
                                <line
                                    x1={centerX}
                                    y1={centerY}
                                    x2={x}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.1)"
                                />
                                {/* Simulated Packet Animation */}
                                <circle r="2" fill="#fff" className={styles.packet}>
                                    <animateMotion
                                        dur={`${2 + Math.random()}s`}
                                        repeatCount="indefinite"
                                        path={`M${centerX},${centerY} L${x},${y}`}
                                    />
                                </circle>
                                <circle r="2" fill="#4facfe" className={styles.packet}>
                                    <animateMotion
                                        dur={`${2 + Math.random()}s`}
                                        repeatCount="indefinite"
                                        path={`M${x},${y} L${centerX},${centerY}`}
                                    />
                                </circle>
                            </g>
                        );
                    })}
                </svg>

                {/* Central Node (Me) */}
                <motion.div
                    className={`${styles.node} ${styles.me} ${styles.pulse}`}
                    style={{ left: '50%', top: '50%' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onMouseEnter={() => setSelectedPeer({ id: 'Self', height: 0, address: 'localhost' })}
                />

                {/* Peers */}
                {peers.map((peer, i) => {
                    const angle = (i / peers.length) * 2 * Math.PI;
                    // Convert from center coordinates to percentage for absolute positioning
                    // Center is 50%, 50%. Radius is ~33% of container.
                    const xPercent = 50 + (35 * Math.cos(angle));
                    const yPercent = 50 + (35 * Math.sin(angle));

                    return (
                        <motion.div
                            key={peer.id}
                            className={styles.node}
                            style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            onMouseEnter={() => setSelectedPeer(peer)}
                        />
                    );
                })}

                {selectedPeer && (
                    <motion.div
                        className={styles.infoCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.infoTitle}>Peer ID</div>
                        <div className={styles.infoValue} style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>
                            {selectedPeer.id}
                        </div>

                        <div className={styles.infoTitle}>Height</div>
                        <div className={styles.infoValue}>{selectedPeer.height}</div>

                        {selectedPeer.address && (
                            <>
                                <div className={styles.infoTitle}>Address</div>
                                <div className={styles.infoValue} style={{ fontSize: '0.8rem' }}>
                                    {selectedPeer.address}
                                </div>
                            </>
                        )}

                        {selectedPeer.protocol && (
                            <>
                                <div className={styles.infoTitle}>Protocol</div>
                                <div className={styles.infoValue} style={{ fontSize: '0.8rem' }}>
                                    {selectedPeer.protocol}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                    <div className={styles.infoTitle}>Active Peers</div>
                    <div className={styles.infoValue} style={{ fontSize: '2.5rem' }}>{peers.length}</div>
                </div>
                <div className={styles.statItem}>
                    <div className={styles.infoTitle}>Protocol Version</div>
                    <div className={styles.infoValue}>/nocostcoin/1.0.0</div>
                </div>
                <div className={styles.statItem}>
                    <div className={styles.infoTitle}>Network Status</div>
                    <div className={styles.infoValue} style={{ color: '#00fa9a' }}>Healthy</div>
                </div>
            </div>
        </div>
    );
}
