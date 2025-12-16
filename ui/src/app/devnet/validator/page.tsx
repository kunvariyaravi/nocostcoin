'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';


interface ValidatorStatus {
    pubkey: string;
    stake: number;
    is_active: boolean;
    last_voted_slot: number;
}

interface ConsensusState {
    finalized_block_hash: string;
    finalized_height: number;
    current_epoch: number;
    current_slot: number;
}

export default function ValidatorPage() {
    const [status, setStatus] = useState<ValidatorStatus | null>(null);
    const [consensus, setConsensus] = useState<ConsensusState | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statusRes, consensusRes] = await Promise.all([
                    fetch('/api/node/validator'),
                    fetch('/api/node/consensus')
                ]);

                if (statusRes.ok) {
                    setStatus(await statusRes.json());
                }
                if (consensusRes.ok) {
                    setConsensus(await consensusRes.json());
                }
            } catch (error) {
                console.error('Failed to fetch validator data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    return (
        <main>

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Validator Dashboard</h1>
                </div>

                <div className={styles.grid}>
                    {/* Validator Identity Card */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Identity & Status</h2>
                        {loading ? <p>Loading...</p> : status ? (
                            <>
                                <div className={styles.row}>
                                    <span className={styles.label}>Public Key</span>
                                    <span className={`${styles.value} ${styles.hash}`}>{status.pubkey}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Status</span>
                                    <span className={`${styles.value} ${status.is_active ? styles.statusActive : styles.statusInactive}`}>
                                        {status.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Stake</span>
                                    <span className={styles.value}>{status.stake} NOC</span>
                                </div>
                            </>
                        ) : (
                            <p>Validator not initialized.</p>
                        )}
                    </div>

                    {/* Consensus Health Card */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Consensus Health</h2>
                        {loading ? <p>Loading...</p> : consensus ? (
                            <>
                                <div className={styles.row}>
                                    <span className={styles.label}>Current Epoch</span>
                                    <span className={styles.value}>{consensus.current_epoch}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Current Slot</span>
                                    <span className={styles.value}>{consensus.current_slot}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Finalized Height</span>
                                    <span className={styles.value}>{consensus.finalized_height}</span>
                                </div>
                                <div className={styles.row}>
                                    <span className={styles.label}>Finalized Block</span>
                                    <span className={`${styles.value} ${styles.hash}`}>{consensus.finalized_block_hash.substring(0, 16)}...</span>
                                </div>
                            </>
                        ) : (
                            <p>Consensus data unavailable.</p>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
