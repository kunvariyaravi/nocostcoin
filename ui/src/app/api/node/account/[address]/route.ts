import { NextResponse } from 'next/server';
import { NODE_API_URL } from '@/lib/nodeApi';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { address: string } }
) {
    try {
        const address = params.address;
        const backendUrl = NODE_API_URL;

        console.log(`[Debug] Account Route: Address=${address}`);
        console.log(`[Debug] Resolved BackendURL=${backendUrl}`);

        const response = await fetch(`${backendUrl}/account/${address}`, {
            cache: 'no-store',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 });
            }
            return NextResponse.json(
                { error: `Backend responded with ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching account:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
