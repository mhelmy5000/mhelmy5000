/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @mizan/domain is a workspace TS package consumed directly.
  transpilePackages: ['@mizan/domain'],
  async rewrites() {
    // Proxy /api/* to the Mizan API so the browser calls same-origin in dev.
    const target = process.env.API_URL ?? 'http://localhost:3001';
    return [{ source: '/api/:path*', destination: `${target}/api/:path*` }];
  },
};
export default nextConfig;
