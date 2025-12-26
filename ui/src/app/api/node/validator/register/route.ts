import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const backendUrl = 'http://localhost:8000';
        const body = await request.json();

        // Validate request body
        if (!body.stake) {
            return NextResponse.json(
                { error: 'Missing stake amount' },
                { status: 400 }
            );
        }

        const response = await fetch(`${backendUrl}/validator/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error registering validator:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
