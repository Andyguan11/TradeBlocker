/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/check-extension-connection',
        destination: '/api/check-extension-connection',
      },
    ]
  },
}

module.exports = nextConfig
