import { NextResponse } from 'next/server';
import { NODE_API_URL } from '@/lib/nodeApi';
import {
    AGENT_PAYMENT_WINDOW_BLOCKS,
    AGENT_PRICE_NCC,
    AGENT_RESOURCE,
    AGENT_SERVICE_ADDRESS,
    toHex,
} from '@/lib/agentPayments';

export const dynamic = 'force-dynamic';

/**
 * A paid endpoint.
 *
 * The caller pays on the chain and passes the transaction hash. The service
 * verifies the payment against the node itself: the transaction has to be in a
 * block, it has to pay this service, and it has to pay enough. Only then does
 * it serve the resource.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const payment = searchParams.get('payment');

        if (!payment) {
            return NextResponse.json(
                {
                    error: 'Payment required',
                    how: 'Pay 1 NCC to the service address, then call this endpoint with ?payment=<tx-hash>',
                    price_ncc: AGENT_PRICE_NCC,
                    service_address: AGENT_SERVICE_ADDRESS,
                },
                { status: 402 }
            );
        }

        const txRes = await fetch(`${NODE_API_URL}/transaction/${payment}`, {
            cache: 'no-store',
        });

        if (!txRes.ok) {
            return NextResponse.json(
                { error: 'Payment not found on the chain' },
                { status: 402 }
            );
        }

        const record = await txRes.json();

        if (record.status !== 'confirmed' || !record.block_hash) {
            return NextResponse.json(
                {
                    error: 'Payment is not confirmed yet',
                    status: record.status || 'unknown',
                },
                { status: 402 }
            );
        }

        const tx = record.transaction;
        const receiver = toHex(tx.receiver || []);

        if (receiver !== AGENT_SERVICE_ADDRESS) {
            return NextResponse.json(
                { error: 'Payment was not made to this service' },
                { status: 402 }
            );
        }

        const amount = tx.data?.NativeTransfer?.amount;
        if (typeof amount !== 'number' || amount < AGENT_PRICE_NCC) {
            return NextResponse.json(
                { error: `Payment too small - ${AGENT_PRICE_NCC} NCC required` },
                { status: 402 }
            );
        }

        // The payment has to be recent. A serverless function has no memory
        // between calls, so this is what stops an old payment being replayed.
        const headRes = await fetch(`${NODE_API_URL}/stats`, { cache: 'no-store' });
        const head = await headRes.json();

        const blockRes = await fetch(`${NODE_API_URL}/block/${record.block_hash}`, {
            cache: 'no-store',
        });
        const block = await blockRes.json();
        const slot = block?.header?.slot ?? 0;
        const age = (head?.height ?? 0) - slot;

        if (age > AGENT_PAYMENT_WINDOW_BLOCKS) {
            return NextResponse.json(
                {
                    error: 'Payment has expired - the window is a few minutes, pay again',
                    payment_age_blocks: age,
                },
                { status: 402 }
            );
        }

        return NextResponse.json({
            ...AGENT_RESOURCE,
            settled: {
                payment_tx: payment,
                block: record.block_hash,
                slot,
                amount_ncc: amount,
                payer: toHex(tx.sender || []),
                paid_at_head: head?.height ?? null,
            },
        });
    } catch (error) {
        console.error('Agent payment verification failed:', error);
        return NextResponse.json(
            { error: 'Failed to verify the payment' },
            { status: 500 }
        );
    }
}
