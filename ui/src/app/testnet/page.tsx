'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    PaperAirplaneIcon,
    ArrowPathIcon,
    BanknotesIcon,
    DocumentDuplicateIcon,
    CheckIcon,
    QrCodeIcon,
    BoltIcon,
    WalletIcon
} from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '@/contexts/WalletContext';
import * as BrowserWallet from '@/lib/wallet/browserWallet';

import TransactionConfirmation, { TransactionData } from '@/components/TransactionConfirmation/TransactionConfirmation';

interface Stats {
    height: number;
    peer_count: number;
    balance: number;
    address: string;
    head_hash: string;
}

export default function TestnetDashboard() {
    const { wallet, isConnected, isUnlocked } = useWallet();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [balance, setBalance] = useState<number>(0);

    // Send State
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [sending, setSending] = useState(false);
    const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [confirmTransaction, setConfirmTransaction] = useState<TransactionData | null>(null);

    // Faucet State
    const [faucetLoading, setFaucetLoading] = useState(false);
    const [faucetStatus, setFaucetStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Receive State
    const [copied, setCopied] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/node/stats');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setStats(data);
            setError(false);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        if (!wallet?.address) return;

        try {
            const accountRes = await fetch(`/api/node/account/${wallet.address}`);
            if (accountRes.ok) {
                const account = await accountRes.json();
                setBalance(account.balance);
            }
        } catch (e) {
            console.error("Balance fetch error", e);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (wallet?.address) {
            fetchBalance();
            const interval = setInterval(fetchBalance, 5000);
            return () => clearInterval(interval);
        }
    }, [wallet?.address]);

    const copyToClipboard = () => {
        if (wallet?.address) {
            navigator.clipboard.writeText(wallet.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setTxStatus(null);

        if (!wallet?.privateKey) {
            setTxStatus({ type: 'error', msg: 'Wallet is locked' });
            return;
        }

        if (!recipient || !amount) {
            setTxStatus({ type: 'error', msg: 'Please fill in all fields' });
            return;
        }

        setConfirmTransaction({
            from: wallet.address,
            to: recipient,
            amount: parseInt(amount),
            fee: 0
        });
    };

    const executeTransaction = async (password?: string) => {
        if (!wallet?.privateKey || !confirmTransaction) return;

        setSending(true);
        setTxStatus(null);

        try {
            // Create transaction data to sign
            const txData = {
                sender: wallet.address,
                receiver: confirmTransaction.to,
                amount: confirmTransaction.amount,
                nonce: Date.now(), // Simplified - should get from blockchain
            };

            // Sign transaction client-side
            const dataToSign = new TextEncoder().encode(JSON.stringify(txData));
            const signature = await BrowserWallet.signData(dataToSign, wallet.privateKey);

            // Send signed transaction to node
            const res = await fetch('/api/node/transaction/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction: txData,
                    signature: Array.from(signature), // Convert Uint8Array to array
                })
            });

            if (res.ok) {
                const hash = await res.json();
                setTxStatus({ type: 'success', msg: `Sent! Hash: ${hash}` });
                setRecipient('');
                setAmount('');
                setConfirmTransaction(null);
                fetchBalance();
            } else {
                const err = await res.json();
                setTxStatus({ type: 'error', msg: typeof err === 'object' ? (err.error || JSON.stringify(err)) : err });
            }
        } catch (e) {
            setTxStatus({ type: 'error', msg: `Failed to send: ${e}` });
        } finally {
            setSending(false);
        }
    };

    const handleFaucet = async () => {
        if (!wallet?.address) return;
        setFaucetLoading(true);
        setFaucetStatus(null);

        try {
            const res = await fetch('/api/node/faucet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: wallet.address })
            });

            if (res.ok) {
                const data = await res.json();
                setFaucetStatus({ type: 'success', msg: `Received ${data.amount} NCC!` });
                fetchBalance();
            } else {
                const err = await res.json();
                setFaucetStatus({ type: 'error', msg: typeof err === 'object' ? (err.error || JSON.stringify(err)) : err });
            }
        } catch (e) {
            setFaucetStatus({ type: 'error', msg: 'Faucet request failed' });
        } finally {
            setFaucetLoading(false);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="p-4 rounded-full bg-red-500/10 text-red-500">
                    <BoltIcon className="w-12 h-12" />
                </div>
                <h2 className="text-xl font-bold text-slate-200">Node Connection Failed</h2>
                <p className="text-slate-400 mt-2">
                    Unable to connect to the Nocostcoin network. Please try again in a moment.
                </p>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                        Overview
                    </h1>
                    <p className="text-slate-400 mt-2">Manage your testnet interactions.</p>
                </div>

                <div className="card border-slate-700 text-center py-16 max-w-2xl mx-auto">
                    <WalletIcon className="w-20 h-20 text-slate-700 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                    <p className="text-slate-400 mb-6">
                        Connect your browser wallet to send transactions, use the faucet, and interact with the testnet.
                    </p>
                    <p className="text-sm text-slate-500">
                        Click "Connect Wallet" in the top-right corner to get started.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                    Overview
                </h1>
                <p className="text-slate-400 mt-2">Manage your testnet interactions.</p>
            </div>


            {/* Core Interaction Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 0. Wallet Stats Card */}
                <div className="card border-emerald-500/20 bg-slate-800/50 flex flex-col">
                    <div className="flex items-center gap-3 mb-4 text-emerald-400">
                        <WalletIcon className="w-6 h-6" />
                        <h3 className="text-lg font-bold">My Wallet</h3>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Balance</p>
                            <p className="text-3xl font-bold text-white mb-4">
                                {balance.toLocaleString()} <span className="text-lg text-emerald-400 font-normal">NCC</span>
                            </p>
                            <p className="text-sm text-slate-400 mb-1">Address</p>
                            <div className="flex items-center justify-between bg-slate-900/50 rounded p-2 border border-slate-700">
                                <code className="text-xs text-slate-300 font-mono truncate mr-2">
                                    {wallet?.address}
                                </code>
                                <button onClick={copyToClipboard} className="text-slate-500 hover:text-white transition-colors">
                                    {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1. Send Card */}
                <div className="card border-blue-500/20 bg-slate-800/50 flex flex-col">
                    <div className="flex items-center gap-3 mb-4 text-blue-400">
                        <PaperAirplaneIcon className="w-6 h-6 -rotate-45" />
                        <h3 className="text-lg font-bold">Send NCC</h3>
                    </div>
                    {!isUnlocked ? (
                        <div className="flex-1 flex flex-col justify-between">
                            <p className="text-sm text-slate-400 mb-4">
                                Unlock your wallet to send transactions.
                            </p>
                            <button className="w-full btn-secondary opacity-50 cursor-not-allowed" disabled>
                                Wallet Locked
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="input font-mono text-sm bg-slate-900/50"
                                    placeholder="Recipient Address"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="input font-mono bg-slate-900/50"
                                    placeholder="Amount (NCC)"
                                    min="1"
                                    required
                                />
                            </div>
                            {txStatus && (
                                <div className={`p-2 rounded text-xs border ${txStatus.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    <p className="break-all">{txStatus.msg}</p>
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={sending}
                                className="btn-primary w-full py-2 flex items-center justify-center gap-2"
                            >
                                {sending ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : 'Send Transaction'}
                            </button>
                        </form>
                    )}
                </div>

                <TransactionConfirmation
                    isOpen={!!confirmTransaction}
                    transaction={confirmTransaction}
                    onConfirm={executeTransaction}
                    onCancel={() => setConfirmTransaction(null)}
                    requirePassword={false} // Enable when fully implemented
                />

                {/* 2. Faucet Card */}
                <div className="card border-violet-500/20 bg-slate-800/50 flex flex-col">
                    <div className="flex items-center gap-3 mb-4 text-violet-400">
                        <BanknotesIcon className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Faucet</h3>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <p className="text-sm text-slate-400 mb-4">
                            Request 1,000 free NCC testnet tokens. Available once every 24 hours per wallet.
                        </p>

                        <div className="space-y-4">
                            {faucetStatus && (
                                <div className={`p-2 rounded text-xs border ${faucetStatus.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                    <p className="break-all">{faucetStatus.msg}</p>
                                </div>
                            )}
                            <button
                                onClick={handleFaucet}
                                disabled={faucetLoading || !wallet}
                                className="w-full btn-secondary border-violet-500/50 text-violet-300 hover:bg-violet-500/10 hover:border-violet-400 hover:text-white transition-all"
                            >
                                {faucetLoading ? 'Requesting...' : 'Request 1,000 NCC'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Run a Node Card */}
                {/* 3. Run a Node Card */}
                <div className="card border-purple-500/20 bg-slate-800/50 flex flex-col">
                    <div className="flex items-center gap-3 mb-4 text-purple-400">
                        <BoltIcon className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Run a Node</h3>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <p className="text-sm text-slate-400 mb-4">
                            Support the network and earn rewards by running your own validator node.
                        </p>

                        <a
                            href="/blog/how-to-run-node"
                            target="_blank"
                            className="w-full btn-secondary border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 hover:text-white transition-all text-center"
                        >
                            Read Setup Guide
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}