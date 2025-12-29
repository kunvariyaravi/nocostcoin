import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Forward to backend API (default to port 8000)
        const backendPort = process.env.NEXT_PUBLIC_API_PORT || '8000';
        const response = await fetch(`http://localhost:${backendPort}/faucet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
