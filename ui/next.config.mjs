/** @type {import('next').NextConfig} */
const nextConfig = {
    // The standalone server is what the Docker image runs (see Dockerfile).
    // Vercel manages its own output, so leave it off there.
    output: process.env.VERCEL ? undefined : 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
