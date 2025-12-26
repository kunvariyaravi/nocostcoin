"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import NetworkStatus from './NetworkStatus';

export default function TestnetNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path ? 'text-primary-600 font-semibold border-b-2 border-primary-600' : 'text-gray-700';

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <Link href="/" className="text-2xl font-bold text-gradient">
                                Nocostcoin
                            </Link>
                            <div className="hidden sm:block">
                                <NetworkStatus />
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/testnet" className={`${isActive('/testnet')} hover:text-primary-600 transition-colors pb-1`}>
                                Dashboard
                            </Link>
                            <Link href="/testnet/wallet" className={`${isActive('/testnet/wallet')} hover:text-primary-600 transition-colors pb-1`}>
                                Wallet
                            </Link>
                            <Link href="/testnet/explorer" className={`${isActive('/testnet/explorer')} hover:text-primary-600 transition-colors pb-1`}>
                                Explorer
                            </Link>
                            <Link href="/testnet/peers" className={`${isActive('/testnet/peers')} hover:text-primary-600 transition-colors pb-1`}>
                                Peers
                            </Link>
                            <Link href="/testnet/network" className={`${isActive('/testnet/network')} hover:text-primary-600 transition-colors pb-1`}>
                                Network
                            </Link>
                            <Link href="https://github.com/kunvariyaravi/nocostcoin" className="btn-secondary text-sm" target="_blank">
                                GitHub
                            </Link>
                        </div>

                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/50" onClick={closeMenu}></div>
                <div className={`absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg transition-transform duration-300 ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                    <div className="flex flex-col p-4 space-y-2">
                        <Link href="/testnet" className="px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                            Dashboard
                        </Link>
                        <Link href="/testnet/wallet" className="px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                            Wallet
                        </Link>
                        <Link href="/testnet/explorer" className="px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                            Explorer
                        </Link>
                        <Link href="/testnet/peers" className="px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                            Peers
                        </Link>
                        <Link href="/testnet/network" className="px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                            Network
                        </Link>
                        <Link href="https://github.com/kunvariyaravi/nocostcoin" className="btn-secondary text-center" target="_blank">
                            GitHub
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
