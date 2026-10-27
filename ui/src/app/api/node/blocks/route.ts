import { NextResponse } from 'next/server';
import { NODE_API_URL } from '@/lib/nodeApi';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const start_height = searchParams.get('start_height');
        const limit = searchParams.get('limit') || '10';

        // Use environment variable or fallback to localhost
        const backendUrl = NODE_API_URL;

        let url = `${backendUrl}/blocks?limit=${limit}`;
        if (start_height) {
            url += `&start_height=${start_height}`;
        }

        const response = await fetch(url, {
            cache: 'no-store',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend responded with ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching blocks:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
