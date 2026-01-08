import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    console.log('[API] /transaction/send called');
    try {
        const bodyText = await request.text();
        console.log('[API] /transaction/send body:', bodyText);
        if (!bodyText) {
            throw new Error('Empty request body');
        }
        const body = JSON.parse(bodyText);

        // Transform the frontend transaction format to the backend format if needed
        // Backend SubmitTransaction expects a "Transaction" object with:
        // { sender: [bytes], receiver: [bytes], nonce: u64, data: { NativeTransfer: { amount: u64 } }, signature: [bytes] }
        // BUT the API endpoint likely expects the serialized structure or a JSON representation that serde deserializes.
        // Let's assume the API server uses serde_json to deserialize the struct.
        // We need to match:
        // pub struct Transaction {
        //     pub sender: Vec<u8>,
        //     pub receiver: Vec<u8>,
        //     pub nonce: u64,
        //     pub data: TransactionData,
        //     pub signature: Vec<u8>,
        // }
        // TransactionData::NativeTransfer { amount: u64 }

        // This means we need to convert hex strings back to byte arrays (arrays of numbers) for JSON

        const tx = {
            sender: hexToBytes(body.sender),
            receiver: hexToBytes(body.receiver),
            nonce: body.nonce,
            data: { NativeTransfer: { amount: body.amount } },
            signature: hexToBytes(body.signature)
        };

        console.log('[API] Transformed TX:', JSON.stringify(tx));

        const backendUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        console.log('[API] Forwarding to:', `${backendUrl}/transaction/send`);

        const response = await fetch(`${backendUrl}/transaction/send`, {
            method: 'POST',
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(tx),
        });

        const responseText = await response.text();
        console.log(`[API] Backend response status: ${response.status}`);
        console.log(`[API] Backend response body: ${responseText}`);

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend error: ${response.status}`, details: responseText },
                { status: response.status }
            );
        }

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data);
        } catch (e) {
            console.warn('[API] Backend response was not JSON, returning as plain text result.');
            // Handle case where backend returns non-JSON (e.g. string "OK")
            return NextResponse.json({ result: responseText });
        }
    } catch (error: any) {
        console.error('[API] /transaction/send Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit transaction' },
            { status: 500 }
        );
    }
}

function hexToBytes(hex: string): number[] {
    const bytes = [];
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}
