/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow larger audio file uploads
    },
  },
}

module.exports = nextConfig
