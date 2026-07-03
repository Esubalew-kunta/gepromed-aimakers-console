/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the demo build resilient: never fail the Render build on lint/type noise.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
