/**
 * Server-side helpers for talking to the Nocostcoin node API.
 *
 * The node API is reached from the server only (Next.js route handlers), so
 * the node's bearer token stays in a server environment variable and is never
 * shipped to the browser.
 *
 * Environment (set on the Vercel project):
 *   INTERNAL_API_URL       https://api.nocostcoin.com
 *   NOCOSTCOIN_API_TOKEN   the node's token, only needed for the endpoints
 *                          that act as the node (transaction/create,
 *                          validator/register, wallet/new, wallet/recover)
 */

export const NODE_API_URL =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000';

/**
 * Headers for a node API request, including the bearer token when one is
 * configured. Never call this from client-side code.
 */
export function nodeApiHeaders(
    extra?: Record<string, string>
): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    const token = process.env.NOCOSTCOIN_API_TOKEN;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
