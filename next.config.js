/** @type {import('next').NextConfig} */
const nextConfig = {
  // We'll start with these basic settings
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  async redirects() {
    return [
      {
        source: '/2025',
        destination: '/',
        permanent: false
      }
    ]
  }
}

module.exports = nextConfig
