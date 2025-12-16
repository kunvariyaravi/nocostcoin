"use client";

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function WebsiteNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const isActive = (path: string) => pathname === path ? styles.activeLink : '';

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.container}>
                    <Link href="/" className={styles.logo} onClick={closeMenu}>
                        Nocost<span>coin</span>
                    </Link>

                    <div className={styles.navLinks}>
                        <Link href="/about" className={`${styles.link} ${isActive('/about')}`}>About</Link>
                        <Link href="/contact" className={`${styles.link} ${isActive('/contact')}`}>Contact</Link>
                        <Link href="/whitepaper" className={`${styles.link} ${isActive('/whitepaper')}`}>Whitepaper</Link>
                        <Link href="/devnet" className={styles.cta}>
                            Launch Devnet
                        </Link>
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
                <Link href="/about" className={styles.mobileLink} onClick={closeMenu}>About</Link>
                <Link href="/contact" className={styles.mobileLink} onClick={closeMenu}>Contact</Link>
                <Link href="/whitepaper" className={styles.mobileLink} onClick={closeMenu}>Whitepaper</Link>
                <Link href="/devnet" className={styles.mobileLink} onClick={closeMenu}>
                    Launch Devnet
                </Link>
            </div>
        </>
    );
}
