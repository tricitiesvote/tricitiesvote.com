const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // We'll start with these basic settings
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
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
  },
  webpack: (config, { isServer }) => {
    // Ensure webpack understands the @/* path alias
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  }
}

module.exports = nextConfig
