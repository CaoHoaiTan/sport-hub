import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@sporthub/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  webpack: (config) => {
    // Resolve .js imports to .ts files in workspace packages
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
