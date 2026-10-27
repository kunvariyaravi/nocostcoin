import ExplorerClient from './ExplorerClient';

export const dynamic = 'force-dynamic';

async function getData() {
    const backendUrl = process.env.INTERNAL_API_URL || 'http://localhost:8000';
    try {
        const res = await fetch(`${backendUrl}/blocks?limit=20`, {
            cache: 'no-store',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch blocks');
        }

        return res.json();
    } catch (error) {
        console.error('Error fetching blocks:', error);
        return [];
    }
}

export default async function ExplorerPage() {
    const data = await getData();

    return <ExplorerClient initialBlocks={data} />;
}
