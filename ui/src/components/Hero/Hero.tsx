import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.gridBg} />

            <div className={styles.content}>
                <div className={styles.eyebrow}>Devnet Live Now</div>

                <h1 className={styles.title}>
                    The Future is <br />
                    <span>Deterministic</span>
                </h1>

                <p className={styles.subtitle}>
                    Nocostcoin is the world&apos;s first blockchain with Hidden Leader Election and Proof of Determinism. Zero fees. Infinite scalability.
                </p>

                <div className={styles.actions}>
                    <Link href="#" className={styles.primaryBtn}>
                        Start Building
                    </Link>
                    <Link href="/whitepaper" className={styles.secondaryBtn}>
                        Read Whitepaper
                    </Link>
                </div>
            </div>
        </section>
    );
}
