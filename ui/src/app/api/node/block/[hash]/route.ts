import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { hash: string } }
) {
    try {
        const hash = params.hash;
        const backendUrl = 'http://localhost:8000';

        const response = await fetch(`${backendUrl}/block/${hash}`);

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
