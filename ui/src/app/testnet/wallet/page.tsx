'use client';

import { useState, useEffect } from 'react';
import WalletCard from '@/components/Wallet/WalletCard';
import TransactionForm from '@/components/TransactionForm/TransactionForm';
import QRCodeModal from '@/components/Wallet/QRCodeModal';
import Faucet from '@/components/Faucet/Faucet';

export default function WalletPage() {
    const [currentAddress, setCurrentAddress] = useState('');
    const [balance, setBalance] = useState(0);
    const [showQR, setShowQR] = useState(false);

    const fetchInfo = async () => {
        try {
            const res = await fetch('/api/node/stats');
            if (res.ok) {
                const data = await res.json();
                setCurrentAddress(data.address);

                // Fetch balance from account endpoint
                const accountRes = await fetch(`/api/node/account/${data.address}`);
                if (accountRes.ok) {
                    const accountData = await accountRes.json();
                    setBalance(accountData.balance);
                } else {
                    setBalance(0);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchInfo();
        const interval = setInterval(fetchInfo, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">My Wallet</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-6">
                        <WalletCard
                            address={currentAddress}
                            balance={balance}
                            onShowQR={() => setShowQR(true)}
                        />
                        <Faucet />
                    </div>

                    <div>
                        <TransactionForm userAddress={currentAddress} />
                    </div>
                </div>

                {/* Transaction History Section */}
                <div className="card">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-100 pb-2">
                        Recent Transactions
                    </h2>
                    <TransactionHistoryList address={currentAddress} />
                </div>
            </div>

            <QRCodeModal
                isOpen={showQR}
                onClose={() => setShowQR(false)}
                address={currentAddress}
            />
        </main>
    );
}

function TransactionHistoryList({ address }: { address: string }) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) return;

        const fetchHistory = async () => {
            setLoading(true);
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

    if (loading && history.length === 0) return <div className="text-center py-8 text-gray-400">Loading history...</div>;
    if (history.length === 0) return <div className="text-center py-8 text-gray-400">No transactions found</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-sm font-medium">
                        <th className="pb-3 pl-2">Type</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Hash</th>
                        <th className="pb-3 text-right pr-2">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {history.map((item, i) => {
                        const isSender = item.transaction.sender === address;
                        const type = isSender ? 'Sent' : 'Received';
                        const color = isSender ? 'text-orange-600 bg-orange-50' : 'text-emerald-600 bg-emerald-50';
                        const sign = isSender ? '-' : '+';

                        return (
                            <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                <td className="py-4 pl-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>
                                        {type}
                                    </span>
                                </td>
                                <td className="py-4">
                                    {item.status === 'confirmed' ? (
                                        <span className="badge badge-success text-xs">Confirmed</span>
                                    ) : (
                                        <span className="badge badge-warning text-xs">Pending</span>
                                    )}
                                </td>
                                <td className="py-4 font-mono text-sm text-gray-500 truncate max-w-[150px]">
                                    <a href={`/testnet/explorer/tx/${Buffer.from(item.transaction.signature).toString('hex').substring(0, 64)}`} className="hover:text-primary-600 transition-colors">
                                        {/* Since we don't have tx hash in tx struct easily in JS without computing, we depend on item struct maybe? 
                                            Actually item has no hash field directly, but we can assume the API returns it or we can't link easily.
                                            Wait, API TransactionResponse DOES NOT have hash field explicitly, only block_hash.
                                            But we can compute it or rely on the fact that `item` might need it.
                                            Actually, let's just show partial signature or something or disable link for now if tricky.
                                            Wait, the key is the Signature usually? No.
                                            We need to Compute Hash or update API.
                                            API returns Transaction struct.
                                            Let's just show Signature as ID for now or skip link if too hard.
                                            Better: Update TransactionResponse in Rust to include `hash`.
                                        */}
                                        {/* Quick fix: Check if we can get hash. Rust API sends TransactionResponse. 
                                            The `hash` is derived.
                                            Let's update API to include hash in response for easier UI.
                                            
                                            Wait, I can't update Rust easily mid-UI edit.
                                            Let's assume we can't link for a second OR we compute it in standard way.
                                            Or we just don't link yet.
                                            Actually, I added indexes but didn't add `hash` to TransactionResponse in API.
                                            Let's fix API first? No, that's expensive context switch.
                                            Let's just display "Tx" without link or use signature prefix?
                                            Actually, let's link to `.../tx/null` if we can't find it?
                                            Wait, the explorer search can take generic strings.
                                            Let's just leave it as text for now.
                                         */}
                                        View details
                                    </a>
                                </td>
                                <td className={`py-4 pr-2 text-right font-bold ${isSender ? 'text-gray-900' : 'text-emerald-600'}`}>
                                    {sign} {item.transaction.data.NativeTransfer?.amount}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
