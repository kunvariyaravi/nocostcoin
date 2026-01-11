'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function DocsShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
                {/* Mobile Menu Toggle */}
                <div className="md:hidden flex items-center justify-between mb-6">
                    <span className="text-lg font-bold text-slate-200">Documentation</span>
                    <button
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg"
                    >
                        {isMobileOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : (
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                Menu
                            </span>
                        )}
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <aside className={`w-full md:w-64 flex-shrink-0 ${isMobileOpen ? 'block' : 'hidden md:block'}`}>
                    <nav className="sticky top-24 space-y-8 bg-slate-950/95 backdrop-blur z-10 md:bg-transparent">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Getting Started</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/documentation" className="text-slate-400 hover:text-emerald-400 transition-colors block py-1" onClick={() => setIsMobileOpen(false)}>
                                        Overview
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/documentation/how-to-run-node" className="text-slate-400 hover:text-emerald-400 transition-colors block py-1" onClick={() => setIsMobileOpen(false)}>
                                        Run a Node
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Core Concepts</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/documentation/architecture" className="text-slate-400 hover:text-emerald-400 transition-colors block py-1" onClick={() => setIsMobileOpen(false)}>
                                        Architecture
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/documentation/api" className="text-slate-400 hover:text-emerald-400 transition-colors block py-1" onClick={() => setIsMobileOpen(false)}>
                                        API Reference
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="https://github.com/kunvariyaravi/nocostcoin" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors block py-1">
                                        GitHub
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <Link href="/" className="text-sm text-emerald-500 hover:text-emerald-400 flex items-center gap-2">
                                ← Back to Website
                            </Link>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 min-w-0 ${isMobileOpen ? 'hidden md:block' : 'block'}`}>
                    <div className="prose prose-invert prose-emerald max-w-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
