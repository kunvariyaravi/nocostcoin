import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/stats`);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch stats' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({
            ...data,
            debug_env: {
                internal: process.env.INTERNAL_API_URL,
                public: process.env.NEXT_PUBLIC_API_URL
            }
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Internal Server Error',
            debug_env: {
                internal: process.env.INTERNAL_API_URL,
                public: process.env.NEXT_PUBLIC_API_URL,
                error: String(error)
            }
        }, { status: 500 });
    }
}
