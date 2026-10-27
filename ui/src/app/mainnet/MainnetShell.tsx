'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Footer from '@/components/Footer/Footer';
import { WalletProvider } from '@/contexts/WalletContext';

export default function MainnetShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <WalletProvider>
            <div className="min-h-screen bg-slate-950 text-slate-50 flex overflow-x-hidden">
                <Sidebar
                    isOpen={isMobileOpen}
                    onClose={() => setIsMobileOpen(false)}
                />

                {/* Mobile Overlay */}
                {isMobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}

                <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0 transition-all duration-300">
                    {/* Top Header Area */}
                    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 md:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                                onClick={() => setIsMobileOpen(!isMobileOpen)}
                                aria-label="Toggle Menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>
                            <div className="text-sm breadcrumbs text-slate-400">
                                Mainnet Environment
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
                        {children}
                    </main>

                    <Footer />
                </div>
            </div>
        </WalletProvider>
    );
}
