"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './Navbar.module.css';

export default function DevnetNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? styles.activeLink : '';

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.container}>
                    <Link href="/" className={styles.logo}>
                        Nocost<span>coin</span>
                    </Link>

                    <div className={styles.navLinks}>
                        <Link href="/devnet" className={`${styles.link} ${isActive('/devnet')}`}>Dashboard</Link>
                        <Link href="/devnet/wallet" className={`${styles.link} ${isActive('/devnet/wallet')}`}>Wallet</Link>
                        <Link href="/devnet/explorer" className={`${styles.link} ${isActive('/devnet/explorer')}`}>Explorer</Link>
                        <Link href="/devnet/peers" className={`${styles.link} ${isActive('/devnet/peers')}`}>Peers</Link>
                        <Link href="/devnet/network" className={`${styles.link} ${isActive('/devnet/network')}`}>Network</Link>
                        <Link href="https://github.com/kunvariyaravi/nocostcoin" className={styles.cta} target="_blank">GitHub</Link>
                    </div>

                    <button
                        className={styles.mobileMenuBtn}
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            <div className={`${styles.mobileMenuPane} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
                <Link href="/devnet" className={styles.mobileLink} onClick={closeMenu}>Dashboard</Link>
                <Link href="/devnet/wallet" className={styles.mobileLink} onClick={closeMenu}>Wallet</Link>
                <Link href="/devnet/explorer" className={styles.mobileLink} onClick={closeMenu}>Explorer</Link>
                <Link href="/devnet/peers" className={styles.mobileLink} onClick={closeMenu}>Peers</Link>
                <Link href="/devnet/network" className={styles.mobileLink} onClick={closeMenu}>Network</Link>
                <Link href="https://github.com/kunvariyaravi/nocostcoin" className={styles.mobileLink} target="_blank">GitHub</Link>
            </div>
        </>
    );
}
