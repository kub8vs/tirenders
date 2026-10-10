/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ["exceljs", "@prisma/client"] },
};
export default nextConfig;
