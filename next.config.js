/** @type {import('next').NextConfig} */
const nextConfig = {
  // We'll start with these basic settings
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
