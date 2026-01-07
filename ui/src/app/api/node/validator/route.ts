import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        // Build URL with optional address parameter
        let url = `${backendUrl}/validator`;
        if (address) {
            url += `?address=${encodeURIComponent(address)}`;
        }

        const response = await fetch(url);

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
