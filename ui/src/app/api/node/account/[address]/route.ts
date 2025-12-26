import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { address: string } }
) {
    try {
        const address = params.address;
        const backendUrl = 'http://localhost:8000';

        const response = await fetch(`${backendUrl}/account/${address}`);

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 });
            }
            return NextResponse.json(
                { error: `Backend responded with ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching account:', error);
        return NextResponse.json(
            { error: 'Failed to connect to Nocostcoin node' },
            { status: 500 }
        );
    }
}
