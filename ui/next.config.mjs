/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/node/:path*',
                destination: 'http://127.0.0.1:8005/:path*', // Proxy to Rust API
            },
        ];
    },
};

export default nextConfig;
