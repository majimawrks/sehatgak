import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    // Silence "inferred workspace root" warning — project root is the repo root
    root: path.resolve(__dirname),
  },
}

export default nextConfig
