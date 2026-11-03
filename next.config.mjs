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
          { key: 'Access-Control-Allow-Headers', value: '*' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/:action((?!_next|asset|storage|public|uploads|favicon\\.ico).*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
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
      // Catch-all: any /:action POST/GET call that isn't a Next.js page or /api/ route
      // gets transparently proxied to /api/:action so the Flutter app and admin panel
      // can both call /updateAppdata, /changePassword, /testPaystackKey, etc. without /api/ prefix.
      {
        source: '/updateAppdata',
        destination: '/api/updateAppdata',
      },
      {
        source: '/changePassword',
        destination: '/api/changePassword',
      },
      {
        source: '/testPaystackKey',
        destination: '/api/testPaystackKey',
      },
      {
        source: '/updatePrivacy',
        destination: '/api/updatePrivacy',
      },
      {
        source: '/updateTerms',
        destination: '/api/updateTerms',
      },
      {
        source: '/viewPrivacy',
        destination: '/api/viewPrivacy',
      },
      {
        source: '/viewTerms',
        destination: '/api/viewTerms',
      },
    ];
  },
};

export default nextConfig;
