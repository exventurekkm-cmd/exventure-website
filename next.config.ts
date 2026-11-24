import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async redirects() {
    const has = [{ type: "host" as const, value: "(?:www\\.exventure\\.co\\.kr|exventure-website\\.vercel\\.app)" }];
    return [
      { source: "/", destination: "https://exventure.co.kr/", has, permanent: false },
      { source: "/:section(about|activities|business|contact|news|privacy|tools)/:path*",
        destination: "https://exventure.co.kr/:section/:path*", has, permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/fonts/pretendard/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
};
export default config;
