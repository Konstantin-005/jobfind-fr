/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  devIndicators: {
    buildActivity: false
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8081/api/:path*',
        },
      ],
    };
  },
}

module.exports = nextConfig