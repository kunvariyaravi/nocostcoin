import Link from 'next/link';
import styles from './PreFooter.module.css';

export default function PreFooter() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Ready to Launch?</h2>
                <p className={styles.subtitle}>
                    Join the thousands of developers building on the future of deterministic consensus.
                </p>
                <div className={styles.actions}>
                    <Link href="/devnet" className={styles.primaryBtn}>
                        Launch Devnet
                    </Link>
                    <Link href="/contact" className={styles.secondaryBtn}>
                        Contact Sales
                    </Link>
                </div>
            </div>
        </section>
    );
}
