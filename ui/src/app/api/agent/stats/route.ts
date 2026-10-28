import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { NODE_API_URL } from '@/lib/nodeApi';
import {
    AGENT_PRICE_NCC,
    AGENT_SERVICE_ADDRESS,
    BLOCK_TIME_SECONDS,
    toHex,
} from '@/lib/agentPayments';

export const dynamic = 'force-dynamic';

/**
 * The transaction hash, computed the way the node computes it.
 *
 * The blocks endpoint returns raw transactions without a hash, so it has to be
 * derived here: sha256(sender || receiver || nonce || "NativeTransfer" || amount).
 */
function transactionHash(
    sender: number[],
    receiver: number[],
    nonce: number,
    amount: number
): string {
    const hash = createHash('sha256');
    hash.update(Buffer.from(sender));
    hash.update(Buffer.from(receiver));
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64LE(BigInt(nonce));
    hash.update(nonceBuffer);
    hash.update(Buffer.from('NativeTransfer', 'utf-8'));
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(amount));
    hash.update(amountBuffer);
    return hash.digest('hex');
}

/**
 * Live figures about the paid API, read straight off the chain.
 *
 * The payment count is the number of transfers to the service address in the
 * recent blocks, so it is the real usage of the chain rather than a counter
 * this app keeps.
 */
export async function GET() {
    try {
        const [blocksRes, headRes] = await Promise.all([
            fetch(`${NODE_API_URL}/blocks?limit=100`, { cache: 'no-store' }),
            fetch(`${NODE_API_URL}/stats`, { cache: 'no-store' }),
        ]);

        if (!blocksRes.ok || !headRes.ok) {
            return NextResponse.json(
                { error: 'Could not reach the node' },
                { status: 502 }
            );
        }

        const blocks = await blocksRes.json();
        const head = await headRes.json();

        let payments = 0;
        let volume = 0;
        const recent: {
            tx: string;
            block: string;
            payer: string;
            amount: number;
            slot: number;
        }[] = [];

        for (const block of blocks) {
            for (const tx of block.transactions || []) {
                if (toHex(tx.receiver || []) !== AGENT_SERVICE_ADDRESS) continue;
                const amount = tx.data?.NativeTransfer?.amount;
                if (typeof amount !== 'number') continue;

                payments += 1;
                volume += amount;
                recent.push({
                    tx: transactionHash(tx.sender || [], tx.receiver || [], tx.nonce || 0, amount),
                    block: block.hash,
                    payer: toHex(tx.sender || []).slice(0, 16),
                    amount,
                    slot: block.header?.slot ?? 0,
                });
            }
        }

        return NextResponse.json({
            height: head.height,
            price_ncc: AGENT_PRICE_NCC,
            service_address: AGENT_SERVICE_ADDRESS,
            block_time_seconds: BLOCK_TIME_SECONDS,
            payments_in_last_100_blocks: payments,
            volume_in_last_100_blocks: volume,
            recent: recent.slice(-10).reverse(),
        });
    } catch (error) {
        console.error('Agent stats failed:', error);
        return NextResponse.json(
            { error: 'Failed to read the chain' },
            { status: 500 }
        );
    }
}
