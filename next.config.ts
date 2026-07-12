import type { NextConfig } from "next";

const adminSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  // LAN IP など localhost 以外から dev サーバーへアクセスするとき用。
  // 未設定だと /_next/* がブロックされ、クライアントが「読み込み中」のまま止まる。
  allowedDevOrigins: [
    "192.168.2.136",
  ],

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
