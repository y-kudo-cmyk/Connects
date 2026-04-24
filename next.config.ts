import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.24'],
  // 画像最適化: Supabase Storage / seventeen-17.jp (S3) / Google Drive CDN / Glide CDN / etc を許可
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cjhwxocabmmrsmdfyqzr.supabase.co' },
      { protocol: 'https', hostname: 's3-ap-northeast-1.amazonaws.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'contents.perfect.ne.jp' },
    ],
    formats: ['image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
