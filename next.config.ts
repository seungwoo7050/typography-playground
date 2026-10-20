import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 백엔드가 없는 정적 배포 대상(Cloudflare Workers 정적 자산, wrangler.toml) —
  // 서버 런타임을 두지 않는다.
  output: "export",
  // next/image 최적화는 서버 런타임이 필요해 정적 export에서 동작하지 않는다.
  // 래스터 자산은 빌드 전에 수동으로 최적화한다.
  images: {
    unoptimized: true,
  },
  devIndicators: false,
};

export default nextConfig;
