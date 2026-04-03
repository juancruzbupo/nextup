import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@barjukebox/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },
    ],
  },
};

export default nextConfig;
