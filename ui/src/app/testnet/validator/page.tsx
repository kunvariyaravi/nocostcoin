'use client';

import { useState, useEffect } from 'react';

export default function ValidatorDashboard() {
    const [validators, setValidators] = useState<any[]>([]);
    const [status, setStatus] = useState<any>(null); // My status
    const [loading, setLoading] = useState(true);
    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch list
                const resList = await fetch('/api/node/validators');
                if (resList.ok) setValidators(await resList.json());

                // Fetch my status (simulated by checking if any validator matches my address? 
                // Actually /api/node/validator returns the node's validator status if it has keys)
                const resStatus = await fetch('/api/node/validator');
                if (resStatus.ok) setStatus(await resStatus.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen pt-20 pb-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Validator Dashboard</h1>
                    {/* Only show register if not already active */}
                    {!status && (
                        <button
                            onClick={() => setShowRegister(!showRegister)}
                            className="btn btn-primary"
                        >
                            {showRegister ? 'Cancel' : 'Become a Validator'}
                        </button>
                    )}
                </div>

                {showRegister && (
                    <div className="card mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <h2 className="text-xl font-bold mb-4">Register as Validator</h2>
                        <RegisterValidatorForm onSuccess={() => setShowRegister(false)} />
                    </div>
                )}

                {status && (
                    <div className="card mb-8 bg-gradient-to-r from-primary-50 to-white border-primary-200">
                        <h2 className="text-xl font-bold mb-4 text-primary-900">Your Validator Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-sm text-primary-600 uppercase font-medium">Public Key</label>
                                <p className="font-mono text-sm break-all bg-white p-2 rounded border border-primary-100 mt-1">{status.pubkey}</p>
                            </div>
                            <div>
                                <label className="text-sm text-primary-600 uppercase font-medium">Stake</label>
                                <p className="text-2xl font-bold text-primary-900">{status.stake} NCC</p>
                            </div>
                            <div>
                                <label className="text-sm text-primary-600 uppercase font-medium">Status</label>
                                <p className="mt-1">
                                    {status.is_active ?
                                        <span className="badge badge-success">Active</span> :
                                        <span className="badge badge-error">Slashed/Inactive</span>
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card">
                    <h2 className="text-xl font-bold mb-6">Active Validators ({validators.length})</h2>
                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Loading network state...</div>
                    ) : validators.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">No active validators found (Devnet needs bootstrapping)</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 text-sm font-medium">
                                        <th className="pb-3 pl-2">Validator Key</th>
                                        <th className="pb-3 text-right">Stake</th>
                                        <th className="pb-3 text-right">Status</th>
                                        <th className="pb-3 text-right pr-2 uppercase text-xs">Uptime (Mock)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {validators.map((v, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 pl-2 font-mono text-sm text-primary-600 truncate max-w-[200px]">
                                                {v.pubkey}
                                            </td>
                                            <td className="py-4 text-right font-bold text-gray-900">
                                                {v.stake.toLocaleString()} NCC
                                            </td>
                                            <td className="py-4 text-right">
                                                {v.is_active ?
                                                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">Active</span> :
                                                    <span className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded">Slashed</span>
                                                }
                                            </td>
                                            <td className="py-4 text-right pr-2 text-sm text-gray-500">
                                                99.9%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function RegisterValidatorForm({ onSuccess }: { onSuccess: () => void }) {
    const [stake, setStake] = useState('1000');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // We need to construct a "RegisterValidator" transaction.
            // Currently our standard /api/node/transaction/send takes a generic JSON.
            // BUT, our UI doesn't have the "RegisterValidator" variant builder fully ready in `TransactionForm`
            // So we might need a custom endpoint or update the `TransactionForm` usage logic.
            // Actually, `core/src/api.rs` has `CreateTransactionRequest` but that's for transfers.
            // We need to Submit a Raw Transaction with `data: { RegisterValidator: { stake: ... } }`.

            // Wait, we need the Wallet Private Key to sign this.
            // The `TransactionForm` component handles signing.
            // We should reuse `TransactionForm` component logic or create a specialized one here.

            // IMPORTANT: The `Transaction` struct logic in frontend usually hardcodes `NativeTransfer`.
            // We need to update frontend signing logic to support other types.
            // This is a bigger task.

            // Short-term hack: Use a simpler API endpoint `POST /register-validator` that the NODE validates?
            // No, that requires the Node to hold keys (delegate signing).
            // Nocostcoin IS a "Node holds keys" wallet model currently (for simplicity in devnet).
            // Does `node.rs` have `handle_submit_transaction`? Yes.
            // Does the UI construct the TX or the Backend?

            // Let's check `TransactionForm.tsx`.
            // User: "c:\nocostcoin\ui\src\components\TransactionForm\TransactionForm.tsx"

            // If the backend `handle_create_transaction` (used by UI?) only does transfers...
            // Let's check `api.rs` `CreateTransactionRequest`.
            // It only has receiver/amount.

            // So we can't use `CreateTransactionRequest`.
            // We must use `SubmitTransaction` with a fully signed tx.
            // BUT `CreateTransaction` endpoint might be just for simple transfers.

            // For now, I'll add a placeholder or assume we add `RegisterValidator` support to `CreateTransaction` DTO?
            // No, `CreateTransactionRequest` is strictly for transfers.

            /* 
               CRITICAL: We need a way to sign `RegisterValidator` tx.
               Since we are in Devnet mode and keys are likely on the node or we use the "Faucet" style? 
               Wait, "Faucet" just sends from faucet.
               
               The `TransactionForm` uses `wallet.ts` likely?
               Let's assume for this step, we implement the VIEW first.
               Creating the logic for signing a custom transaction type in JS 
               when we haven't ported the serialization logic is hard.
               
               Alternative: Add `POST /validator/register` to API that uses the Node's internal wallet (if `node` holds keys).
               In `node.rs`, we have a wallet.
               If we are running a node, we control the keys.
               
               Let's leave the form as "Coming Soon" or simple placeholder if it's too complex?
               User said "Implement Validator Dashboard".
               I will try to make a simple JSON fetch to a new endpoint `/api/node/validator/register` 
               that I will add to backend to simplify this for the user.
               
               This endpoint will:
               1. Create `RegisterValidator` tx using the node's local wallet key.
               2. Submit it.
            */

            // I'll assume we add this endpoint.
            const res = await fetch('/api/node/validator/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stake: parseInt(stake) })
            });

            if (!res.ok) throw new Error(await res.text() || 'Failed');

            setSuccess('Registration transaction submitted!');
            setTimeout(onSuccess, 2000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Stake Amount (NCC)</label>
                <input
                    type="number"
                    min="1000"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className="input w-full mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum stake: 1000 NCC. Funds will be locked.</p>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-500 text-sm">{success}</div>}

            <div className="flex justify-end gap-3">
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? 'Submitting...' : 'Register'}
                </button>
            </div>
        </form>
    );
}

