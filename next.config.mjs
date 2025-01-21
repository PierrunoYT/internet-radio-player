/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
      {
        protocol: 'http',
        hostname: '*',
      }
    ],
    unoptimized: true, // Allow loading from any source since radio stations might use various image hosting setups
  },
};

export default nextConfig; 