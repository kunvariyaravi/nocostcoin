import { NextResponse } from 'next/server';
import { NODE_API_URL } from '@/lib/nodeApi';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        const backendUrl = NODE_API_URL;

        // Build URL with optional address parameter
        let url = `${backendUrl}/validator`;
        if (address) {
            url += `?address=${encodeURIComponent(address)}`;
        }

        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            // If the endpoint returns 404, it means the user is not a validator
            if (response.status === 404) {
                return NextResponse.json(null, { status: 404 });
            }
            return NextResponse.json(
                { error: `Backend responded with ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching validator status:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
