import { NextResponse } from 'next/server';
import { NODE_API_URL } from '@/lib/nodeApi';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Forward to backend API
        const backendUrl = NODE_API_URL;
        const response = await fetch(`${backendUrl}/faucet`, {
            method: 'POST',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to connect to faucet' },
            { status: 500 }
        );
    }
}
