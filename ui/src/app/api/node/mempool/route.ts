import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const backendUrl = 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/mempool`);

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend responded with ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching mempool:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
