'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function Explorer() {
    const [search, setSearch] = useState('');
    const [block, setBlock] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search) return;

        setLoading(true);
        setError('');
        setBlock(null);

        try {
            const res = await fetch(`/api/node/block/${search}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Block not found');
                throw new Error('Failed to fetch block');
            }
            const data = await res.json();
            setBlock(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                <button className={styles.button} type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <p className={styles.error}>{error}</p>}

            {block && (
                <div className={styles.result}>
                    <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Block Details</h2>
                    <div className={styles.json}>
                        {JSON.stringify(block, null, 2)}
                    </div>
                </div>
            )}
        </main>
    );
}
