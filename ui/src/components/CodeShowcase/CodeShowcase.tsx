import styles from './CodeShowcase.module.css';

export default function CodeShowcase() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Simplicity for Developers</h2>
                    <p className={styles.subtitle}>Interact with the blockchain using a clean, modern JSON-RPC API.</p>
                </div>

                <div className={styles.codeBlock}>
                    <div className={styles.codeHeader}>
                        <div className={styles.dot} style={{ background: '#ff5f56' }} />
                        <div className={styles.dot} style={{ background: '#ffbd2e' }} />
                        <div className={styles.dot} style={{ background: '#27c93f' }} />
                        <span className={styles.filename}>curl-request.sh</span>
                    </div>
                    <pre className={styles.code}>
                        <code>
                            <span className={styles.keyword}>curl</span> -X POST http://localhost:8000/api/node/transaction/create \<br />
                            -H <span className={styles.string}>&quot;Content-Type: application/json&quot;</span> \<br />
                            -d <span className={styles.string}>&apos;{`{`}
                                &quot;receiver&quot;: &quot;abcd1234...&quot;,
                                &quot;amount&quot;: 100
                                {`}`}&apos;</span>
                        </code>
                    </pre>
                </div>

                <div className={styles.tags}>
                    <span className={styles.tag}>Rust Core</span>
                    <span className={styles.tag}>JSON-RPC</span>
                    <span className={styles.tag}>WebSocket Events</span>
                </div>
            </div>
        </section>
    );
}
