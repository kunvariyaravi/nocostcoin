'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    WalletIcon,
    CubeTransparentIcon,
    ServerStackIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                // Using a fast endpoint like stats or just root check
                const res = await fetch('/api/node/stats', { signal: AbortSignal.timeout(2000) });
                setIsOnline(res.ok);
            } catch (e) {
                setIsOnline(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { name: 'Dashboard', href: '/testnet', icon: HomeIcon },
        { name: 'Wallet', href: '/testnet/wallet', icon: WalletIcon },
        { name: 'Explorer', href: '/testnet/explorer', icon: CubeTransparentIcon },
        { name: 'Validator', href: '/testnet/validator', icon: ServerStackIcon },
        { name: 'Network', href: '/testnet/network', icon: GlobeAltIcon },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col z-50">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-700/50">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">N</span>
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Noconet
                    </span>
                </Link>
                <div className="mt-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs font-medium text-blue-400 w-fit">
                    TESTNET BETA
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Status */}
            <div className="p-4 border-t border-slate-700/50">
                <div className={`p-4 rounded-xl border ${isOnline ? 'bg-slate-800/50 border-slate-700' : 'bg-red-900/10 border-red-900/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`text-xs font-medium ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isOnline ? 'Node Online' : 'Node Offline'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">v0.1.0-alpha</p>
                </div>
            </div>
        </aside>
    );
}
