import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const start_height = searchParams.get('start_height');
        const limit = searchParams.get('limit') || '10';

        // Default to port 8000
        const backendUrl = 'http://localhost:8000';

        let url = `${backendUrl}/blocks?limit=${limit}`;
        if (start_height) {
            url += `&start_height=${start_height}`;
        }

        const response = await fetch(url);

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
