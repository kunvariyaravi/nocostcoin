import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <Link href="/" className={styles.logo}>
                Nocost<span>coin</span>
            </Link>

            <div className={styles.navLinks}>
                <Link href="/whitepaper" className={styles.link}>Whitepaper</Link>
                <Link href="/explorer" className={styles.link}>Explorer</Link>
                <Link href="/dashboard" className={styles.link}>Dashboard</Link>
                <Link href="#" className={styles.link}>Governance</Link>
                <Link href="https://github.com/nocostcoin" className={styles.cta}>GitHub</Link>
            </div>
        </nav>
    );
}
