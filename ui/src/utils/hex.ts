export function toHex(buffer: any): string {
    if (!buffer) return '';

    // Handle array of numbers (Vec<u8> from Rust via JSON)
    if (Array.isArray(buffer)) {
        return buffer.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Handle Buffer object structure { type: 'Buffer', data: [...] }
    if (buffer && buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
        return buffer.data.map((b: number) => b.toString(16).padStart(2, '0')).join('');
    }

    // If it's already a string, return it
    if (typeof buffer === 'string') return buffer;

    return '';
}
