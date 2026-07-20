/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the demo build resilient: never fail the Render build on lint/type noise.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: true,
  poweredByHeader: false,
  // pdfkit (used by /api/programs for the real PDF download) loads its
  // built-in font metrics (.afm) files via relative paths at runtime.
  // Webpack-bundling it breaks that lookup ("Helvetica.afm ENOENT"), so it
  // must stay a native require, resolved from node_modules as usual.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
