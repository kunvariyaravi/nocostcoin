'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

interface Transaction {
    sender: number[];
    receiver: number[];
    amount: number;
    nonce: number;
    signature: number[];
}

interface BlockHeader {
    parent_hash: string;
    slot: number;
    epoch: number;
    timestamp: number;
    validator_pubkey: number[];
    state_root: string;
    tx_root: string;
}

interface Block {
    header: BlockHeader;
    hash: string;
    transactions: Transaction[];
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

export default function BlockDetails({ params }: { params: { hash: string } }) {
    const [block, setBlock] = useState<Block | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlock = async () => {
            try {
                const res = await fetch(`/api/node/block/${params.hash}`);
                if (!res.ok) throw new Error('Block not found');
                const data = await res.json();
                setBlock(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (params.hash) {
            fetchBlock();
        }
    }, [params.hash]);

    if (loading) return <div className={styles.loading}>Loading block...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!block) return <div className={styles.error}>Block not found</div>;

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <Link href="/explorer" className={styles.backLink}>← Back to Explorer</Link>
                <h1 className={styles.title}>Block Details</h1>
                <p className={styles.subtitle}>{block.hash}</p>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Header</h2>
                <div className={styles.card}>
                    <div className={styles.row}>
                        <span className={styles.label}>Height (Slot):</span>
                        <span className={styles.value}>{block.header.slot}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Epoch:</span>
                        <span className={styles.value}>{block.header.epoch}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Timestamp:</span>
                        <span className={styles.value}>{new Date(block.header.timestamp).toLocaleString()}</span>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Parent Hash:</span>
                        <Link href={`/explorer/${block.header.parent_hash}`} className={styles.link}>
                            {block.header.parent_hash}
                        </Link>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Validator:</span>
                        <span className={styles.value}>{toHex(block.header.validator_pubkey)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Transactions ({block.transactions.length})</h2>
                <div className={styles.txList}>
                    {block.transactions.length > 0 ? (
                        block.transactions.map((tx, i) => (
                            <div key={i} className={styles.txCard}>
                                <div className={styles.row}>
                                    <span className={styles.label}>Hash:</span>
                                    <span className={styles.hash}>{toHex(tx.signature)}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>From:</span>
                                    <span className={styles.value}>{truncate(toHex(tx.sender), 20)}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>To:</span>
                                    <span className={styles.value}>{truncate(toHex(tx.receiver), 20)}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Amount:</span>
                                    <span className={styles.amount}>{tx.amount} NCC</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.empty}>No transactions in this block</div>
                    )}
                </div>
            </div>
        </main>
    );
}
