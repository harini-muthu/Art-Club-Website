/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb"
    }
  },
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
