/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/admin", destination: "/panel", permanent: true },
      { source: "/admin/:path*", destination: "/panel/:path*", permanent: true },
    ];
  },
  experimental: { serverComponentsExternalPackages: ["exceljs", "@prisma/client"] },
};
export default nextConfig;
