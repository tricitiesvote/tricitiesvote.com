const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // We'll start with these basic settings
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // public/ is served from the CDN; keep its ~280MB of images out of
    // serverless function bundles (Vercel caps functions at 250MB)
    outputFileTracingExcludes: {
      '*': ['./public/**']
    }
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  async redirects() {
    return [
      {
        source: '/2026',
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
