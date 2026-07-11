import type { NextConfig } from "next";

const adminSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/admin",
        headers: adminSecurityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: adminSecurityHeaders,
      },
    ];
  },
};

export default nextConfig;
