/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/login',
        destination: 'https://trade-blocker-g5zh.vercel.app/',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
