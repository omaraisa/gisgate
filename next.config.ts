import type { NextConfig } from "next";

// Validate required environment variables at build time
if (!process.env.SERVER_IP) {
  throw new Error('SERVER_IP environment variable is required');
}

const nextConfig: NextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gis-gate.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'http',
        hostname: process.env.SERVER_IP,
        port: '',
        pathname: '/static/image/**',
      },
      {
        protocol: 'http',
        hostname: process.env.SERVER_IP,
        port: '9000',
        pathname: '/images/**',
      },
    ],
  },
};

export default nextConfig;
