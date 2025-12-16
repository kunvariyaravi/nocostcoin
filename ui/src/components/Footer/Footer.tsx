import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.column}>
                    <div className={styles.logo}>
                        Nocost<span>coin</span>
                    </div>
                    <p className={styles.tagline}>
                        The world&apos;s first zero-fee, deterministic blockchain.
                    </p>
                    <div className={styles.copyright}>
                        © 2025 Nocostcoin Foundation
                    </div>
                </div>

                <div className={styles.linksColumn}>
                    <h3>Foundation</h3>
                    <Link href="/about" className={styles.link}>About Us</Link>
                    <Link href="/contact" className={styles.link}>Contact</Link>
                    <Link href="/whitepaper" className={styles.link}>Whitepaper</Link>
                </div>

                <div className={styles.linksColumn}>
                    <h3>Community</h3>
                    <Link href="#" className={styles.link}>Twitter</Link>
                    <Link href="#" className={styles.link}>Discord</Link>
                    <Link href="#" className={styles.link}>Governance</Link>
                </div>

                <div className={styles.linksColumn}>
                    <h3>Legal</h3>
                    <Link href="#" className={styles.link}>Terms of Service</Link>
                    <Link href="#" className={styles.link}>Privacy Policy</Link>
                </div>
            </div>
        </footer>
    );
}
