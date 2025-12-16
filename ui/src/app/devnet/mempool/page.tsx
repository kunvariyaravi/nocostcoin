'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Transaction {
    sender: number[];
    receiver: number[];
    amount: number;
    nonce: number;
    signature: number[];
}

function toHex(bytes: number[]): string {
    return Array.from(bytes, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

function truncate(str: string, n: number) {
    if (str.length <= n) return str;
    return str.slice(0, n) + '...';
}

export default function Mempool() {
    const [txs, setTxs] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMempool = async () => {
            try {
                const res = await fetch('/api/node/mempool');
                if (res.ok) {
                    const data = await res.json();
                    setTxs(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMempool();
        const interval = setInterval(fetchMempool, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mempool</h1>
                <p className={styles.subtitle}>Pending transactions waiting to be included in a block</p>
            </div>

            <div className={styles.list}>
                {loading && txs.length === 0 ? (
                    <div className={styles.empty}>Loading mempool...</div>
                ) : txs.length > 0 ? (
                    txs.map((tx, i) => {
                        const hash = toHex(tx.signature); // Using signature as ID for now
                        return (
                            <div key={hash} className={styles.txCard}>
                                <div className={styles.row}>
                                    <span className={styles.label}>Tx Hash:</span>
                                    <span className={styles.hash}>{truncate(hash, 20)}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Sender:</span>
                                    <span className={styles.value}>{truncate(toHex(tx.sender), 20)}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Receiver:</span>
                                    <span className={styles.value}>{truncate(toHex(tx.receiver), 20)}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Amount:</span>
                                    <span className={styles.amount}>{tx.amount} NCC</span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={styles.empty}>Mempool is empty</div>
                )}
            </div>
        </main>
    );
}
