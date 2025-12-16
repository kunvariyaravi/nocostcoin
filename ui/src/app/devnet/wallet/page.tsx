'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Wallet() {
    const [currentAddress, setCurrentAddress] = useState<string>('');
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [newMnemonic, setNewMnemonic] = useState<string | null>(null);
    const [recoverMnemonic, setRecoverMnemonic] = useState('');
    const [showRecover, setShowRecover] = useState(false);
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');

    const handleSend = async () => {
        if (!receiver || !amount) return;
        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch('/api/node/transaction/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver,
                    amount: parseInt(amount)
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err || "Failed to send transaction");
            }

            const txHash = await res.json();
            setStatus({ type: 'success', msg: `Transaction forwarded! Hash: ${txHash}` });
            setReceiver('');
            setAmount('');
            // Refresh balance after a delay
            setTimeout(fetchInfo, 2000);
        } catch (e: any) {
            setStatus({ type: 'error', msg: e.message });
        } finally {
            setLoading(false);
        }
    };

    // Fetch current wallet info
    const fetchInfo = async () => {
        try {
            const res = await fetch('/api/node/stats');
            if (res.ok) {
                const data = await res.json();
                setCurrentAddress(data.address);
                setBalance(data.balance);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchInfo();
    }, []);

    const handleCreate = async () => {
        if (!confirm("Are you sure? This will replace the current node wallet!")) return;

        setLoading(true);
        setStatus(null);
        setNewMnemonic(null);

        try {
            const res = await fetch('/api/node/wallet/new', { method: 'POST' });
            if (!res.ok) throw new Error("Failed to create wallet");

            const data = await res.json();
            setNewMnemonic(data.mnemonic);
            setCurrentAddress(data.address);
            setBalance(0); // New wallet has 0 balance
            setStatus({ type: 'success', msg: "New wallet created successfully!" });
        } catch (e: any) {
            setStatus({ type: 'error', msg: e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRecover = async () => {
        if (!recoverMnemonic.trim()) return;
        if (!confirm("Are you sure? This will replace the current node wallet!")) return;

        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch('/api/node/wallet/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mnemonic: recoverMnemonic })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err || "Failed to recover wallet");
            }

            const address = await res.json();
            setCurrentAddress(address);
            // Re-fetch stats to get real balance
            setTimeout(fetchInfo, 1000);
            setStatus({ type: 'success', msg: "Wallet recovered successfully!" });
            setRecoverMnemonic('');
            setShowRecover(false);
        } catch (e: any) {
            setStatus({ type: 'error', msg: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Wallet Management</h1>
                <p className={styles.subtitle}>Manage your active node identity</p>
            </div>

            <div className={styles.section}>
                <h2 className={styles.cardTitle}>Active Wallet</h2>
                <div style={{ marginBottom: '1rem' }}>
                    <span className={styles.label}>Address</span>
                    <div className={styles.value}>{currentAddress || 'Loading...'}</div>
                </div>
                <div>
                    <span className={styles.label}>Balance</span>
                    <div className={styles.value}>{balance} NOC</div>
                </div>
            </div>

            <div className={styles.section} style={{ marginTop: '2rem' }}>
                <h2 className={styles.cardTitle}>Send Transaction</h2>
                <div className={styles.card}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Receiver Address</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Receiver public key (hex)"
                            value={receiver}
                            onChange={(e) => setReceiver(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Amount (NOC)</label>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <button
                        className={styles.button}
                        onClick={handleSend}
                        disabled={loading || !receiver || !amount}
                    >
                        {loading ? 'Sending...' : 'Send Transaction'}
                    </button>
                    <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
                        * Transactions are signed by the node&apos;s active wallet.
                    </p>
                </div>
            </div>

            <div className={styles.actions}>
                {/* Create New Wallet Card */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Create New Wallet</h3>
                    <p className={styles.cardText}>
                        Generate a new random wallet. <br />
                        <strong style={{ color: '#ff4444' }}>Warning: Back up your current keys first!</strong>
                    </p>
                    <button
                        className={styles.buttonSecondary}
                        onClick={handleCreate}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Generate New Wallet'}
                    </button>

                    {newMnemonic && (
                        <div className={styles.mnemonicBox}>
                            <p className={styles.mnemonicWarning}>⚠️ SAVE THIS SECRET PHRASE SECURELY!</p>
                            <p className={styles.mnemonicText}>{newMnemonic}</p>
                        </div>
                    )}
                </div>

                {/* Recover Wallet Card */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Recover Wallet</h3>
                    <p className={styles.cardText}>
                        Restore a wallet from a 12-word secret phrase.
                    </p>
                    {!showRecover ? (
                        <button
                            className={styles.buttonSecondary}
                            onClick={() => setShowRecover(true)}
                        >
                            Recover Wallet
                        </button>
                    ) : (
                        <div>
                            <textarea
                                className={styles.textarea}
                                placeholder="Enter your 12-word mnemonic phrase..."
                                value={recoverMnemonic}
                                onChange={(e) => setRecoverMnemonic(e.target.value)}
                            />
                            <button
                                className={styles.button}
                                onClick={handleRecover}
                                disabled={loading || !recoverMnemonic}
                            >
                                {loading ? 'Recovering...' : 'Restore Wallet'}
                            </button>
                            <button
                                style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', width: '100%' }}
                                onClick={() => setShowRecover(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {status && (
                <div className={status.type === 'success' ? styles.success : styles.error}>
                    {status.msg}
                </div>
            )}
        </main>
    );
}
