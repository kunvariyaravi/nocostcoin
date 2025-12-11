import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    © 2025 Nocostcoin Foundation
                </div>

                <div className={styles.links}>
                    <Link href="#" className={styles.link}>Twitter</Link>
                    <Link href="#" className={styles.link}>Discord</Link>
                    <Link href="#" className={styles.link}>Governance</Link>
                    <Link href="#" className={styles.link}>Terms</Link>
                </div>
            </div>
        </footer>
    );
}
