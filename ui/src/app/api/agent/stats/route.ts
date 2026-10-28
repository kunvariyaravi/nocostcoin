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
        const headRes = await fetch(`${NODE_API_URL}/stats`, { cache: 'no-store' });
        if (!headRes.ok) {
            return NextResponse.json(
                { error: 'Could not reach the node' },
                { status: 502 }
            );
        }
        const head = await headRes.json();

        // The node caps a single page at 100 blocks, so walk backwards to
        // cover more of the chain. The node prunes blocks older than 1000, so
        // that is as far back as there is.
        const blocks: any[] = [];
        let startHeight = head.height;
        for (let page = 0; page < 10 && startHeight > 0; page++) {
            const res = await fetch(
                `${NODE_API_URL}/blocks?start_height=${startHeight}&limit=100`,
                { cache: 'no-store' }
            );
            if (!res.ok) break;
            const pageBlocks = await res.json();
            if (!pageBlocks || pageBlocks.length === 0) break;
            blocks.push(...pageBlocks);
            const lowest = Math.min(...pageBlocks.map((b: any) => b.header?.slot ?? 0));
            if (lowest <= 1) break;
            startHeight = lowest - 1;
        }

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
            payments: payments,
            volume: volume,
            blocks_scanned: blocks.length,
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
