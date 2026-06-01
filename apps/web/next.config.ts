/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  },
  async rewrites() {
    // Determine the target URL. If we are proxying, we need the origin of NEXT_PUBLIC_API_URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    return [
      {
        source: '/api/:path*',
        // We rewrite everything going to /api/* to the target API URL
        destination: `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
