import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'media.airnest.me',
        pathname: '/**', 
      },
    ],
    formats: ['image/avif', 'image/webp'], 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default bundleAnalyzer(withNextIntl(nextConfig));