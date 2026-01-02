"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NetworkStatus from './NetworkStatus';

export default function WebsiteNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const isActive = (path: string) => pathname === path ? 'text-primary-600 font-semibold' : 'text-gray-700';

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-md shadow-lg border-b border-slate-800' : 'bg-transparent border-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-2xl font-bold text-gradient" onClick={closeMenu}>
                                Nocostcoin
                            </Link>
                            <div className="hidden sm:block">
                                <NetworkStatus />
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <Link href="/about" className={`${isActive('/about') === 'text-primary-600 font-semibold' ? 'text-primary-500 font-semibold' : 'text-slate-300'} hover:text-white transition-colors`}>
                                About
                            </Link>
                            <Link href="/whitepaper" className={`${isActive('/whitepaper') === 'text-primary-600 font-semibold' ? 'text-primary-500 font-semibold' : 'text-slate-300'} hover:text-white transition-colors`}>
                                Whitepaper
                            </Link>
                            <Link href="/contact" className={`${isActive('/contact') === 'text-primary-600 font-semibold' ? 'text-primary-500 font-semibold' : 'text-slate-300'} hover:text-white transition-colors`}>
                                Contact
                            </Link>
                            <Link href="/testnet" className="btn-primary">
                                Try Testnet →
                            </Link>
                        </div>

                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={toggleMenu}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/50" onClick={closeMenu}></div>
                <div className={`absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg transition-transform duration-300 ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                    <div className="flex flex-col p-4 space-y-2">
                        <Link href="/about" className="px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                            About
                        </Link>
                        <Link href="/whitepaper" className="px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                            Whitepaper
                        </Link>
                        <Link href="/contact" className="px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                            Contact
                        </Link>
                        <Link href="/testnet" className="btn-primary text-center" onClick={closeMenu}>
                            Try Testnet →
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
