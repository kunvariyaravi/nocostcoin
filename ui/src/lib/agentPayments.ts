/**
 * Agent payments: the shared facts of the paid-API demo.
 *
 * The service accepts a payment on the chain instead of an API key. A caller
 * signs a transfer of NCC to the service address, and the service checks the
 * chain itself before serving the resource. Nothing about the caller is
 * trusted except the signature on the transaction.
 */

/** The account that receives the payments. It is the node's own wallet. */
export const AGENT_SERVICE_ADDRESS =
    'dd5b099c02335b7e4f3d6f5e36ea85f9d02117318d52ce7e1fa3cb54dfc2ebeb';

/** What one call costs, in NCC. */
export const AGENT_PRICE_NCC = 1;

/**
 * How recent a payment has to be.
 *
 * A serverless function has no memory between calls, so a payment could
 * otherwise be replayed for ever. Requiring the payment to be recent bounds
 * the replay window to a few minutes. A real service would keep a spent-hash
 * set instead.
 */
export const AGENT_PAYMENT_WINDOW_BLOCKS = 200;

/** Seconds between blocks. */
export const BLOCK_TIME_SECONDS = 2;

/** The paid resource. An agent gets this for 1 NCC. */
export const AGENT_RESOURCE = {
    service: 'nocostcoin-agent-payments',
    resource: 'llm.compute.quote',
    quote: {
        model: 'any-model',
        prompt_tokens: 4096,
        max_output_tokens: 1024,
        price_ncc: AGENT_PRICE_NCC,
    },
    delivery: {
        auth: 'pay-per-call with NCC - no API key, no account, no subscription',
        endpoint: '/api/agent/resource?payment=<tx-hash>',
    },
} as const;

/** Hex-encode a byte array the way the node does. */
export function toHex(bytes: number[] | Uint8Array): string {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
