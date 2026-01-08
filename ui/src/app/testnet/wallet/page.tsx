'use client';

import { useState, useEffect } from 'react';
import {
    CreditCardIcon,
    DocumentDuplicateIcon,
    CheckIcon,
    LockClosedIcon,
    ArrowDownTrayIcon,
    ArrowRightOnRectangleIcon,
    EyeIcon,
    EyeSlashIcon,
    PaperAirplaneIcon,
    QrCodeIcon,
    ArrowsRightLeftIcon,
    ChevronLeftIcon,
    EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { toHex } from '@/utils/hex';
import { useWallet } from '@/contexts/WalletContext';
import * as BrowserWallet from '@/lib/wallet/browserWallet';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator/PasswordStrengthIndicator';

export default function WalletPage() {
    const { wallet, isConnected, isUnlocked, createWallet, importWallet, unlockWallet, lockWallet, disconnect } = useWallet();
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'dashboard' | 'send' | 'receive'>('dashboard');

    const fetchBalance = async () => {
        if (!wallet?.address) return;
        try {
            const accountRes = await fetch(`/api/node/account/${wallet.address}`, { cache: 'no-store' });
            if (accountRes.ok) {
                const account = await accountRes.json();
                setBalance(account.balance);
            }
        } catch (e) {
            console.error("Connection error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (wallet?.address && isUnlocked) {
            fetchBalance();
            const interval = setInterval(fetchBalance, 5000);
            return () => clearInterval(interval);
        }
    }, [wallet?.address, isUnlocked]);

    // Reset view to dashboard when connected (fixes "Logout?" screen appearing after re-login)
    useEffect(() => {
        if (isConnected) {
            setView('dashboard');
        }
    }, [isConnected]);

    // --- AUTHENTICATION FLOWS (Create/Import/Login) ---
    if (!isConnected || !isUnlocked) {
        return <AuthScreen isConnected={isConnected} isUnlocked={isUnlocked} />;
    }

    // --- MAIN APP (MetaMask Style) ---
    return (
        <div className="flex justify-center items-start min-h-[calc(100vh-100px)] py-8">
            <div className="w-full max-w-[400px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] relative">
                {/* Header */}
                <WalletHeader
                    wallet={wallet}
                    lockWallet={lockWallet}
                    disconnect={() => setView('logout_confirm')}
                    onRevealSecret={() => setView('reveal_secret')}
                />

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-900">
                    {view === 'dashboard' && (
                        <DashboardView
                            balance={balance}
                            loading={loading}
                            onSend={() => setView('send')}
                            onReceive={() => setView('receive')}
                            address={wallet?.address || ''}
                        />
                    )}
                    {view === 'send' && (
                        <SendView
                            onBack={() => setView('dashboard')}
                            address={wallet?.address || ''}
                            balance={balance}
                            onSuccess={() => {
                                fetchBalance();
                                setView('dashboard');
                            }}
                        />
                    )}
                    {view === 'receive' && (
                        <ReceiveView
                            onBack={() => setView('dashboard')}
                            address={wallet?.address || ''}
                        />
                    )}
                    {view === 'reveal_secret' && (
                        <RevealSecretView onBack={() => setView('dashboard')} />
                    )}
                    {view === 'logout_confirm' && (
                        <div className="flex flex-col h-full bg-slate-900/50 p-6 text-center justify-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <ArrowRightOnRectangleIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Logout?</h2>
                            <p className="text-slate-400 text-sm mb-6">
                                Are you sure you want to logout? This will <strong>remove your wallet from this device</strong>.
                                <br /><br />
                                Make sure you have your <strong>Secret Recovery Phrase</strong> backed up, or you will lose your funds forever.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setView('dashboard')} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium text-sm">Cancel</button>
                                <button onClick={disconnect} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors font-bold text-sm shadow-lg shadow-red-900/20">Logout</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function WalletHeader({ wallet, lockWallet, disconnect, onRevealSecret }: { wallet: any, lockWallet: () => void, disconnect: () => void, onRevealSecret: () => void }) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 z-20 shrink-0">
            {/* Network Pill */}
            <div className="flex-1 flex justify-start">
                <div className="bg-slate-800 hover:bg-slate-700 transition-colors px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer border border-slate-700/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-xs font-medium text-slate-300">Nocostcoin Testnet</span>
                </div>
            </div>

            {/* Account Pill */}
            <div className="flex-1 flex justify-center">
                <div className="flex flex-col items-center cursor-pointer group">
                    <span className="text-sm font-bold text-white group-hover:underline decoration-slate-500 underline-offset-4">Account 1</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                        {wallet?.address.slice(0, 5)}...{wallet?.address.slice(-4)}
                    </span>
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 flex justify-end relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                        <div className="absolute top-10 right-0 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-20 overflow-hidden">
                            <button onClick={() => { setShowMenu(false); onRevealSecret(); }} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                                <EyeIcon className="w-4 h-4" /> Show Recovery Phrase
                            </button>
                            <button onClick={lockWallet} className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2">
                                <LockClosedIcon className="w-4 h-4" /> Lock
                            </button>
                            <button onClick={disconnect} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors flex items-center gap-2 border-t border-slate-700/50">
                                <ArrowRightOnRectangleIcon className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function DashboardView({ balance, loading, onSend, onReceive, address }: { balance: number, loading: boolean, onSend: () => void, onReceive: () => void, address: string }) {
    const [tab, setTab] = useState<'tokens' | 'activity'>('tokens');

    return (
        <div className="flex flex-col h-full">
            {/* Main Balance Area */}
            <div className="flex flex-col items-center py-8">
                <div className="text-4xl font-bold text-white tracking-tight mb-1">
                    {loading ? '...' : balance.toLocaleString()}
                    <span className="text-lg text-slate-500 ml-2 font-normal">NCC</span>
                </div>
                <div className="text-sm text-slate-500">$0.00 USD</div>

                {/* Action Buttons */}
                <div className="flex items-center gap-6 mt-8">
                    <ActionButton icon={<ArrowDownTrayIcon />} label="Receive" onClick={onReceive} />
                    <ActionButton icon={<PaperAirplaneIcon className="-rotate-45 translate-x-0.5 translate-y-0.5" />} label="Send" onClick={onSend} primary />
                    <ActionButton icon={<ArrowsRightLeftIcon />} label="Swap" onClick={() => { }} disabled />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-1 bg-slate-950 flex flex-col">
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setTab('tokens')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${tab === 'tokens' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Tokens
                        {tab === 'tokens' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>}
                    </button>
                    <button
                        onClick={() => setTab('activity')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors relative ${tab === 'activity' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        Activity
                        {tab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {tab === 'tokens' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 font-bold text-xs">
                                        N
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-200">Nocostcoin</span>
                                        <span className="text-xs text-slate-500">0 NCC</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-medium text-slate-200">{balance.toLocaleString()}</span>
                                    <span className="text-xs text-slate-500">$0.00</span>
                                </div>
                            </div>
                            <div className="pt-8 text-center">
                                <p className="text-xs text-slate-600 mb-2">Don&apos;t see your token?</p>
                                <button className="text-blue-400 text-sm font-medium hover:text-blue-300">Import tokens</button>
                            </div>
                        </div>
                    )}
                    {tab === 'activity' && (
                        <TransactionHistoryList address={address} />
                    )}
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon, label, onClick, disabled, primary }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center gap-2 group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:-translate-y-1 ${primary ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'}`}>
                <div className="w-5 h-5">{icon}</div>
            </div>
            <span className={`text-xs font-medium ${primary ? 'text-blue-400' : 'text-blue-500/80'}`}>{label}</span>
        </button>
    );
}

function SendView({ onBack, address, balance, onSuccess }: any) {
    const [receiver, setReceiver] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!receiver || !amount) return;
        setLoading(true);
        setStatus(null);

        try {
            if (!wallet?.publicKey) throw new Error("Wallet not fully loaded");

            // 1. Create and Sign Transaction Locally
            // We use the nonce from the balance fetch (nonce state needs to be added to WalletPage)
            // But state might be stale, better to use the one from balance or fetch fresh?
            // Existing 'balance' state only holds number. We need 'nonce' too.
            // Let's assume we add 'nonce' state to WalletPage or fetch it here.

            // Fetch fresh nonce just to be safe
            const accountRes = await fetch(`/api/node/account/${wallet.address}`, { cache: 'no-store' });
            if (!accountRes.ok) throw new Error('Failed to fetch nonce');
            const account = await accountRes.json();
            const currentNonce = account.nonce;

            const signedTx = await BrowserWallet.createAndSignTransaction(
                wallet,
                receiver,
                parseInt(amount), // Assuming integer amount for now or convert float to atomic units if needed. Rust logic used NativeTransfer { amount } which is u64.
                currentNonce
            );

            // 2. Send Signed TX to Backend
            const res = await fetch('/api/node/transaction/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signedTx),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || JSON.stringify(data) || 'Failed to send');

            setStatus({ type: 'success', message: 'Transaction Sent! Hash: ' + (data.substring ? data.substring(0, 16) + '...' : 'Success') });
            setTimeout(onSuccess, 3000);

        } catch (e: any) {
            console.error(e);
            setStatus({ type: 'error', message: e.message || "Transaction failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50">
            {/* Back Header */}
            <div className="h-14 border-b border-slate-800 flex items-center px-4 gap-4">
                <button onClick={onBack} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="font-bold text-white">Send NCC</span>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">To:</label>
                    <input
                        value={receiver}
                        onChange={(e) => setReceiver(e.target.value)}
                        placeholder="Public Address (0x...)"
                        className="w-full bg-black/20 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Asset:</label>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 font-bold text-xs">N</div>
                            <span className="text-sm font-medium text-white">Nocostcoin</span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-400">Balance:</div>
                            <div className="text-xs font-medium text-white">{balance.toLocaleString()} NCC</div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Amount:</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-black/20 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <button
                            onClick={() => setAmount(balance.toString())}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300 font-medium uppercase"
                        >
                            Max
                        </button>
                    </div>
                </div>

                {status && (
                    <div className={`text-xs p-3 rounded text-center ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {status.message}
                    </div>
                )}
            </div>

            <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900">
                <div className="flex justify-between mb-4 text-xs">
                    <span className="text-slate-500">Gas Fee</span>
                    <span className="text-emerald-400 font-medium">0.00 NCC (Free)</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={onBack} className="flex-1 py-3 rounded-full border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500 transition-all font-medium text-sm">Cancel</button>
                    <button
                        onClick={handleSend}
                        disabled={loading || !receiver || !amount}
                        className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all font-bold text-sm shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReceiveView({ onBack, address }: any) {
    // Receive State
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50">
            {/* Back Header */}
            <div className="h-14 border-b border-slate-800 flex items-center px-4 gap-4">
                <button onClick={onBack} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="font-bold text-white">Receive NCC</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-white p-4 rounded-xl mb-8">
                    <QRCodeSVG value={address} size={180} />
                </div>

                <h3 className="text-white font-medium mb-2">My Address</h3>
                <code className="text-xs text-blue-300 bg-blue-900/20 px-3 py-1.5 rounded-full font-mono mb-6 break-all max-w-full">
                    {address}
                </code>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-full text-blue-400 font-medium transition-colors"
                >
                    {copied ? <CheckIcon className="w-5 h-5 text-emerald-500" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
                    {copied ? 'Copied!' : 'Copy Address'}
                </button>

                <p className="text-xs text-slate-500 mt-8 max-w-[200px]">
                    Only send Nocostcoin (NCC) assets to this address. Other assets will be lost forever.
                </p>
            </div>
        </div>
    );
}

// --- AUTH SCREEN ---
function AuthScreen({ isConnected, isUnlocked }: any) {
    const { createWallet, importWallet, unlockWallet, disconnect, refreshWallet } = useWallet();
    const [tab, setTab] = useState<'create' | 'import' | 'unlock'>('unlock');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [importMnemonic, setImportMnemonic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedMnemonic, setGeneratedMnemonic] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!isConnected) setTab('create');
        else if (!isUnlocked) setTab('unlock');
    }, [isConnected, isUnlocked]);

    // Cleanup state on tab change
    useEffect(() => {
        setPassword('');
        setConfirmPassword('');
        setImportMnemonic('');
        setError('');
    }, [tab]);

    const handleCreate = async () => {
        const passwordStrength = BrowserWallet.checkPasswordStrength(password);
        if (!passwordStrength.isStrong) return setError('Weak password: Use 12+ chars, mix case, numbers & symbols');
        if (password !== confirmPassword) return setError('Passwords do not match');

        setLoading(true);
        setError('');
        try {
            // Use BrowserWallet directly to prevent auto-login (context update) until mnemonic is saved
            const res = await BrowserWallet.createWallet(password);
            setGeneratedMnemonic(res.mnemonic);
        } catch (e: any) { setError(e.message) }
        finally { setLoading(false) }
    };

    const handleMnemonicSaved = () => {
        setGeneratedMnemonic('');
        // Refresh context to detect the new wallet and log in
        refreshWallet();
    };

    if (generatedMnemonic) {
        return (
            <div className="flex justify-center items-center min-h-screen py-8">
                <div className="w-full max-w-[400px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <CheckIcon className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Wallet Created!</h2>
                    <p className="text-slate-400 text-sm mb-6">Write down your Secret Recovery Phrase. It is the ONLY way to recover your wallet.</p>

                    <div className="bg-black/40 p-4 rounded-xl mb-6 border border-slate-800 relative group">
                        <pre className="whitespace-pre-wrap font-mono text-emerald-400 text-sm">{generatedMnemonic}</pre>
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-sm pointer-events-none">
                            <span className="text-white text-xs font-bold">Keep this safe!</span>
                        </div>
                    </div>

                    <button onClick={handleMnemonicSaved} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">
                        I&apos;ve stored it securely
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen py-8">
            <div className="w-full max-w-[400px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Logo Area */}
                <div className="h-32 bg-gradient-to-b from-slate-800/80 to-slate-900 flex flex-col items-center justify-center border-b border-slate-800">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl rotate-3 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                        <span className="text-white font-bold text-xl -rotate-3">N</span>
                    </div>
                    <h1 className="text-white font-bold text-lg tracking-tight">Nocostcoin Wallet</h1>
                </div>

                {/* Login/Content Area */}
                <div className="p-8">
                    {tab === 'unlock' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
                                <p className="text-slate-400 text-sm">The decentralized web awaits.</p>
                            </div>

                            <AuthInput
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                icon={<LockClosedIcon className="w-4 h-4" />}
                                value={password}
                                onChange={(e: any) => setPassword(e.target.value)}
                                onKeyPress={(e: any) => e.key === 'Enter' && unlockWallet(password)}
                                rightElement={
                                    <button onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-white transition-colors">
                                        {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                }
                            />

                            <button onClick={() => unlockWallet(password)} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]">
                                Unlock
                            </button>

                            <div className="text-center">
                                <button onClick={() => { disconnect(); setTab('create'); }} className="text-xs text-slate-500 hover:text-blue-400 transition-colors">
                                    Forgot password? <span className="underline decoration-slate-700 underline-offset-2">Reset wallet</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {(tab === 'create' || tab === 'import') && (
                        <div className="space-y-6">
                            {/* Custom Tab Switcher */}
                            <div className="bg-slate-950/50 p-1 rounded-xl flex border border-slate-800">
                                <button
                                    onClick={() => setTab('create')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'create' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Create New
                                </button>
                                <button
                                    onClick={() => setTab('import')}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'import' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Import Existing
                                </button>
                            </div>

                            {tab === 'create' && (
                                <div className="space-y-4 animate-fadeIn">
                                    <AuthInput
                                        label="New Password"
                                        type={showPassword ? "text" : "password"}
                                        icon={<LockClosedIcon className="w-4 h-4" />}
                                        value={password}
                                        onChange={(e: any) => setPassword(e.target.value)}
                                        placeholder="Min 8 chars"
                                        rightElement={
                                            <button onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-white transition-colors">
                                                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                        }
                                    />
                                    <AuthInput
                                        label="Confirm Password"
                                        type={showPassword ? "text" : "password"}
                                        icon={<LockClosedIcon className="w-4 h-4" />}
                                        value={confirmPassword}
                                        onChange={(e: any) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            )}

                            {tab === 'import' && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Secret Recovery Phrase</label>
                                        <textarea
                                            placeholder="Paste your 12-word phrase here..."
                                            className="w-full p-3 bg-slate-950 border border-slate-700/50 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none text-sm font-mono h-24 resize-none placeholder-slate-600 transition-all shadow-inner"
                                            value={importMnemonic}
                                            onChange={(e) => setImportMnemonic(e.target.value)}
                                        />
                                    </div>
                                    <AuthInput
                                        label="New Password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e: any) => setPassword(e.target.value)}
                                        icon={<LockClosedIcon className="w-4 h-4" />}
                                        rightElement={
                                            <button onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-white transition-colors">
                                                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                        }
                                    />
                                    <AuthInput
                                        label="Confirm Password"
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e: any) => setConfirmPassword(e.target.value)}
                                        icon={<LockClosedIcon className="w-4 h-4" />}
                                    />
                                </div>
                            )}

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                                    <div className="w-1 h-8 rounded-full bg-red-500/50 shrink-0"></div>
                                    <p className="text-xs text-red-400 font-medium">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={tab === 'create' ? handleCreate : async () => {
                                    setLoading(true);
                                    try { await importWallet(importMnemonic, password); }
                                    catch (e: any) { setError(e.message); }
                                    finally { setLoading(false); }
                                }}
                                disabled={loading}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : (tab === 'create' ? 'Create Wallet' : 'Import Wallet')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AuthInput({ label, icon, rightElement, ...props }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">{label}</label>
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    {icon}
                </div>
                <input
                    {...props}
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 focus:outline-none transition-all text-sm font-medium shadow-inner autofill:bg-slate-950 autofill:text-white"
                    style={{ colorScheme: 'dark' }} // Forces dark autofill in some browsers
                />
                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helpers
function TransactionHistoryList({ address }: { address: string }) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) return;
        const fetchHistory = async () => {
            if (history.length === 0) setLoading(true);
            try {
                const res = await fetch(`/api/node/account/${address}/history`);
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000);
        return () => clearInterval(interval);
    }, [address]);

    if (loading && history.length === 0) return <div className="text-center py-8 text-slate-500 text-xs">Loading activity...</div>;
    if (history.length === 0) return <div className="text-center py-8 text-slate-500 text-sm">No recent activity</div>;

    return (
        <div className="space-y-4">
            {history.map((item, i) => {
                const isSender = item.transaction.sender === address;
                const type = isSender ? 'Sent' : 'Received';
                return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSender ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                {isSender ? <PaperAirplaneIcon className="-rotate-45 w-4 h-4 translate-x-0.5" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-200">{type} NCC</span>
                                <span className={`text-xs ${isSender ? 'text-amber-500' : 'text-emerald-500'}`}>Confirmed</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-slate-200">{item.transaction.data.NativeTransfer?.amount} NCC</span>
                            <span className="text-xs text-slate-500">
                                {isSender ? 'To: ' : 'From: '}{toHex(isSender ? item.transaction.receiver : item.transaction.sender).slice(0, 4)}...
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function RevealSecretView({ onBack }: any) {
    const { exportMnemonic } = useWallet();
    const [password, setPassword] = useState('');
    const [mnemonic, setMnemonic] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleReveal = () => {
        try {
            const secret = exportMnemonic(password);
            setMnemonic(secret);
            setError('');
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/50">
            {/* Back Header */}
            <div className="h-14 border-b border-slate-800 flex items-center px-4 gap-4">
                <button onClick={onBack} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="font-bold text-white">Show Recovery Phrase</span>
            </div>

            <div className="p-6 space-y-6">
                {!mnemonic ? (
                    <div className="space-y-4">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide mb-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Warning
                            </div>
                            <p className="text-xs text-red-300/80 leading-relaxed">
                                Never share your recovery phrase with anyone. Anyone with this phrase can steal your assets forever.
                            </p>
                        </div>

                        <AuthInput
                            label="Enter Password to Reveal"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e: any) => setPassword(e.target.value)}
                            icon={<LockClosedIcon className="w-4 h-4" />}
                            rightElement={
                                <button onClick={() => setShowPassword(!showPassword)} className="text-slate-500 hover:text-white transition-colors">
                                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                </button>
                            }
                        />

                        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                        <button
                            onClick={handleReveal}
                            disabled={!password}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reveal Secret Phrase
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Secret Recovery Phrase</label>
                            <div className="bg-slate-950 border border-slate-700/50 rounded-xl p-4 relative group">
                                <pre className="whitespace-pre-wrap font-mono text-emerald-400 text-sm">{mnemonic}</pre>
                            </div>
                        </div>

                        <button
                            onClick={() => { navigator.clipboard.writeText(mnemonic); }}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl font-medium transition-colors border border-slate-700"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
