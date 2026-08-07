/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb"
    }
  },
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
