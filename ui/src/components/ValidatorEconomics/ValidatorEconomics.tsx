'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * The validator economics, read live from the chain.
 *
 * The chain mints a fixed amount every reward period and splits it between
 * the validators that produced blocks. The pool is fixed; the share per
 * validator depends on how many validators there are.
 */
export const MONTHLY_REWARD_POOL = 1_296_000;
export const BLOCK_REWARD = 1;
export const EPOCHS_PER_PERIOD = 720;
export const SLOTS_PER_EPOCH = 1800;
export const SECONDS_PER_PERIOD = EPOCHS_PER_PERIOD * SLOTS_PER_EPOCH * 2;

interface ValidatorInfo {
    pubkey: string;
    deposit: number;
    is_active: boolean;
}

export default function ValidatorEconomics({ compact = false }: { compact?: boolean }) {
    const [validators, setValidators] = useState<ValidatorInfo[] | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/node/validators', { cache: 'no-store' });
                if (res.ok) setValidators(await res.json());
            } catch {
                // The headline does not depend on the live count.
            }
        };
        load();
        const interval = setInterval(load, 10000);
        return () => clearInterval(interval);
    }, []);

    const active = validators ? validators.filter((v) => v.is_active).length : null;
    const share = active && active > 0 ? Math.floor(MONTHLY_REWARD_POOL / active) : MONTHLY_REWARD_POOL;

    return (
        <div className={compact ? '' : 'grid grid-cols-1 md:grid-cols-3 gap-6'}>
            <div className={compact ? 'card border-emerald-500/30 bg-emerald-500/5' : 'card border-slate-700/50 bg-slate-800/30'}>
                <p className="text-slate-500 text-sm">Minted every 30 days</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                    {MONTHLY_REWARD_POOL.toLocaleString()} NCC
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    {EPOCHS_PER_PERIOD} epochs &times; {SLOTS_PER_EPOCH} slots &times; {BLOCK_REWARD} NCC
                </p>
            </div>

            <div className={compact ? 'card border-emerald-500/30 bg-emerald-500/5' : 'card border-slate-700/50 bg-slate-800/30'}>
                <p className="text-slate-500 text-sm">Your share</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                    {active === null ? '-' : share.toLocaleString()} NCC
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    per month
                    {active !== null && active > 0
                        ? `, split equally between ${active} validator${active === 1 ? '' : 's'}`
                        : ''}
                </p>
            </div>

            <div className={compact ? 'card border-emerald-500/30 bg-emerald-500/5' : 'card border-slate-700/50 bg-slate-800/30'}>
                <p className="text-slate-500 text-sm">Cost to join</p>
                <h3 className="text-2xl font-bold text-white mt-1">100 NCC</h3>
                <p className="text-xs text-slate-500 mt-1">refundable deposit</p>
            </div>

            {!compact && (
                <div className="md:col-span-3">
                    <p className="text-sm text-slate-400">
                        The pool is fixed, so the share per validator falls as more
                        people join. Everyone who runs a node gets an equal share -
                        there is no stake, so holding more coins buys no extra
                        blocks.{' '}
                        <Link href="/documentation/how-to-run-node" className="text-emerald-400 hover:text-emerald-300">
                            Run a node
                        </Link>
                    </p>
                </div>
            )}
        </div>
    );
}
