/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/node/:path*',
                destination: 'http://localhost:8000/:path*',
            },
        ];
    },
};

export default nextConfig;
