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
  }
}

module.exports = nextConfig
