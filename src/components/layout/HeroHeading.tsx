"use client";

import { useScrollParallax } from "@/lib/motion/scroll-parallax";

interface HeroHeadingProps {
  children: React.ReactNode;
}

/**
 * 도구가 곧 랜딩 페이지인 이 제품에서 유일하게 존재하는 "히어로"
 * 인터랙션 지점 — 스크롤에 따라 헤딩이 살짝 위로 흘러가며 옅어진다.
 */
export function HeroHeading({ children }: HeroHeadingProps) {
  const ref = useScrollParallax<HTMLHeadingElement>();
  return (
    <h1
      ref={ref}
      className="mb-10 font-[family-name:var(--font-display)] text-4xl text-ink sm:text-5xl"
    >
      {children}
    </h1>
  );
}
