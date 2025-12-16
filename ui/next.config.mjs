/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/api/node/:path*',
                destination: `${process.env.API_URL || 'http://127.0.0.1:8000'}/:path*`, // Proxy to Rust API (Bootnode)
            },
        ];
    },
};

export default nextConfig;
