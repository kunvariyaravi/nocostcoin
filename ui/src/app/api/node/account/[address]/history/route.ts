import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { address: string } }
) {
    try {
        const address = params.address;
        const backendUrl = 'http://localhost:8000'; // Could be env var

        const response = await fetch(`${backendUrl}/account/${address}/history`);

        if (!response.ok) {
            // If 500 or timeout, return empty list gracefully or error?
            // Let's forward the error mostly, but for 404/500 we can just return empty for better UX?
            // No, let's be explicit.
            return NextResponse.json(
                { error: `Backend responded with ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching account history:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
