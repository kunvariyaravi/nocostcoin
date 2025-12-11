'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import StatsCard from '@/components/StatsCard/StatsCard';
import TransactionForm from '@/components/TransactionForm/TransactionForm';

interface NodeStats {
    height: number;
    head_hash: string;
    peer_count: number;
    balance: number;
    address: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState<NodeStats | null>(null);
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
        const interval = setInterval(fetchStats, 2000); // Poll every 2s

        return () => clearInterval(interval);
    }, []);

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Network Dashboard</h1>
                    <p className={styles.subtitle}>Real-time Nocostcoin network statistics</p>
                </div>
                <div className={styles.statusIndicator}>
                    <div className={`${styles.dot} ${!error && stats ? styles.online : ''}`} />
                    <span>{!error && stats ? 'Online' : 'Offline / Connecting...'}</span>
                </div>
            </div>

            <div className={styles.grid}>
                <StatsCard
                    label="Block Height"
                    value={stats ? stats.height : '-'}
                />
                <StatsCard
                    label="Peer Count"
                    value={stats ? stats.peer_count : '-'}
                />
                <StatsCard
                    label="My Balance"
                    value={stats ? stats.balance : '-'}
                    subValue="NCC"
                />
                <StatsCard
                    label="Network"
                    value="Testnet"
                />
            </div>

            <div className={styles.section} style={{ marginBottom: '4rem' }}>
                <TransactionForm />
            </div>

            {stats && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Latest Block Hash</h2>
                    <div className={styles.codeBlock}>
                        {stats.head_hash}
                    </div>
                </div>
            )}

            {stats && (
                <div className={styles.section} style={{ marginTop: '2rem' }}>
                    <h2 className={styles.sectionTitle}>Your Address</h2>
                    <div className={styles.codeBlock}>
                        {stats.address}
                    </div>
                </div>
            )}
        </main>
    );
}
