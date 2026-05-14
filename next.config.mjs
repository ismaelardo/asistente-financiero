/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // better-sqlite3 is a native Node.js module — must not be bundled by webpack
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
