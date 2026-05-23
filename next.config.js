/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enables a minimal server bundle in `.next/standalone`, used by the Dockerfile.
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
