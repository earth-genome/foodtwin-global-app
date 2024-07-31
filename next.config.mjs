/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/area/:areaId",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
