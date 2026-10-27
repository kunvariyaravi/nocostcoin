import { NextResponse } from 'next/server';
import { NODE_API_URL } from '@/lib/nodeApi';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { hash: string } }
) {
    try {
        const hash = params.hash;
        const backendUrl = NODE_API_URL;

        const response = await fetch(`${backendUrl}/block/${hash}`, { cache: 'no-store' });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Block not found' }, { status: 404 });
            }
            return NextResponse.json(
                { error: `Backend responded with ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching block:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
