'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Explorer() {
    const [search, setSearch] = useState('');
    const [latestBlock, setLatestBlock] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/node/block/latest')
            .then(res => res.ok ? res.json() : null)
            .then(data => setLatestBlock(data))
            .catch(console.error);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!search) return;
        router.push(`/explorer/${search}`);
    };

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Block Explorer</h1>
                <p className={styles.subtitle}>Search for blocks by hash</p>
            </div>

            <form className={styles.searchContainer} onSubmit={handleSearch}>
                <input
                    className={styles.input}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Enter Block Hash..."
                />
                <button className={styles.button} type="submit">
                    Search
                </button>
            </form>

            <div className={styles.section} style={{ marginTop: '4rem' }}>
                <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Latest Block</h2>
                {latestBlock ? (
                    <Link href={`/explorer/${latestBlock.hash}`} className={styles.blockCard}>
                        <div className={styles.row}>
                            <span style={{ color: '#888' }}>Hash:</span>
                            <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
                                {latestBlock.hash}
                            </span>
                        </div>
                        <div className={styles.row}>
                            <span style={{ color: '#888' }}>Height:</span>
                            <span style={{ color: '#fff' }}>{latestBlock.header.slot}</span>
                        </div>
                        <div className={styles.row}>
                            <span style={{ color: '#888' }}>Txs:</span>
                            <span style={{ color: '#fff' }}>{latestBlock.transactions.length}</span>
                        </div>
                    </Link>
                ) : (
                    <p style={{ color: '#666' }}>Loading latest block...</p>
                )}
            </div>
        </main>
    );
}
