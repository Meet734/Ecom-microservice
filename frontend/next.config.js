/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002'}/api/users/:path*`,
      },
      {
        source: '/api/products/:path*',
        destination: `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3003'}/api/products/:path*`,
      },
      {
        source: '/api/inventory/:path*',
        destination: `${process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || 'http://localhost:3005'}/api/inventory/:path*`,
      },
      {
        source: '/api/orders/:path*',
        destination: `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3004'}/api/orders/:path*`,
      },
    ];
  },
};

export default nextConfig;
