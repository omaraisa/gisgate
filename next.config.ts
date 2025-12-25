import type { NextConfig } from "next";

// Validate required environment variables at build time
if (!process.env.SERVER_IP) {
  throw new Error('SERVER_IP environment variable is required');
}

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.paypalobjects.com https://*.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: http:; connect-src 'self' https://www.paypal.com https://*.paypal.com https://dev.gis-gate.com; frame-src https://www.paypal.com https://www.paypalobjects.com https://*.paypal.com; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ];
  },
  
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
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
  serverExternalPackages: ['canvas', 'fabric'],
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
