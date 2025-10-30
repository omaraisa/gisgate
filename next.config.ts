import type { NextConfig } from "next";

// Validate required environment variables at build time
if (!process.env.SERVER_IP) {
  throw new Error('SERVER_IP environment variable is required');
}

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Handle canvas and fabric native modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
        'fabric/node': 'commonjs fabric/node',
        fabric: 'commonjs fabric',
      });
    }

    // Add fallbacks for client-side
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      'fabric/node': false,
      fs: false,
      path: false,
      os: false,
    };

    // Ignore specific binary files that can't be parsed by webpack
    config.module.rules.push({
      test: /\.node$/,
      use: 'file-loader',
    });

    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['canvas', 'fabric'],
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
