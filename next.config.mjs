/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  outputFileTracingIncludes: {
    '/api/**/*': ['./src/data/geo/**/*', './public/data/geo/**/*'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, apikey, authorization, Accept, X-Requested-With' },
        ],
      },
      {
        source: '/public/storage/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,HEAD,OPTIONS' },
        ],
      },
      {
        source: '/storage/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,HEAD,OPTIONS' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,HEAD,OPTIONS' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/index',
        destination: '/dashboard',
      },
      {
        source: '/public/storage/:path*',
        destination: '/storage/:path*',
      },
      {
        source: '/public/uploads/:path*',
        destination: '/uploads/:path*',
      },
      {
        source: '/public/asset/:path*',
        destination: '/asset/:path*',
      },
      {
        source: '/public/:path*',
        destination: '/:path*',
      },
    ];
  },
};

export default nextConfig;
