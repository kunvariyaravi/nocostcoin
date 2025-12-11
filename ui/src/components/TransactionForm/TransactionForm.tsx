'use client';

import { useState } from 'react';
import styles from './TransactionForm.module.css';

export default function TransactionForm() {
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<null | { type: 'success' | 'error', message: string }>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const res = await fetch('/api/node/transaction/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiver,
                    amount: parseInt(amount),
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data || 'Failed to send transaction');

            setStatus({ type: 'success', message: `Transaction sent! Hash: ${data}` });
            setReceiver('');
            setAmount('');
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <h3 className={styles.title}>Send Funds</h3>

            <div className={styles.inputGroup}>
                <label className={styles.label}>Receiver Address (Hex)</label>
                <input
                    className={styles.input}
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value)}
                    placeholder="e.g., 7c2bfb..."
                    required
                />
            </div>

            <div className={styles.inputGroup}>
                <label className={styles.label}>Amount</label>
                <input
                    type="number"
                    className={styles.input}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    required
                    min="1"
                />
            </div>

            <button className={styles.button} type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Transaction'}
            </button>

            {status && (
                <div className={`${styles.status} ${styles[status.type]}`}>
                    {status.message}
                </div>
            )}
        </form>
    );
}
