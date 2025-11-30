/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // Fix static generation timeout and chunk loading issues
  staticPageGenerationTimeout: 300,
  experimental: {
    optimizePackageImports: ['react-markdown', 'remark-gfm'],
  },
}

module.exports = nextConfig
