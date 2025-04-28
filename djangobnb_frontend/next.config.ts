import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// 使用i18n目录下的request.ts文件
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**'
      },
    ]
  }
};

// 使用next-intl插件包装配置
export default withNextIntl(nextConfig);