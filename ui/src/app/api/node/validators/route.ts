import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const backendUrl = 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/validators`);

        if (!response.ok) {
            // If not found or error, return empty list or error
            return NextResponse.json(
                { error: `Backend responded with ${response.status}` },
                { status: response.status }
            );
        }

        // Check if the response body is empty before parsing JSON
        const text = await response.text();
        if (!text) {
            return NextResponse.json([]); // Return empty array if response body is empty
        }

        const data = JSON.parse(text);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching validators:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
