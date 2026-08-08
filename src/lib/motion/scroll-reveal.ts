"use client";

import { useEffect, useRef, useState } from "react";

export interface ScrollRevealOptions {
  /** 뷰포트 하단에 완전히 걸리기 전에 미리 트리거하고 싶으면 음수
   * 여백을 준다(기본 -10% — 섹션이 거의 다 보일 때 트리거). */
  rootMargin?: string;
  threshold?: number;
}

const DEFAULT_OPTIONS: Required<ScrollRevealOptions> = {
  rootMargin: "0px 0px -10% 0px",
  threshold: 0.1,
};

/**
 * 엘리먼트가 처음 뷰포트에 들어올 때 한 번만 true로 바뀌는 훅 —
 * 스크롤을 위아래로 오갈 때마다 다시 재생되면 산만하므로, 한 번
 * 드러나면 옵저버를 끊고 계속 true로 유지한다(스타일 카드처럼 이미
 * 다른 트리거로 애니메이션되는 콘텐츠와 달리, 이건 순수하게 "이
 * 섹션을 처음 봤다"는 1회성 신호다).
 */
export function useScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {},
) {
  const ref = useRef<T | null>(null);
  // 초기값은 서버/클라이언트 어느 쪽에서 렌더링되든 항상 false다 —
  // 처음엔 "typeof IntersectionObserver === 'undefined'"를 지연
  // 초기화로 판단해 구형 브라우저에서 바로 true로 시작하게 했는데,
  // 이 프로젝트는 정적 export라도 dev 서버/빌드 시점에 클라이언트
  // 컴포넌트를 한 번 서버(Node.js)에서 렌더링한다 — Node에도
  // IntersectionObserver가 없어 매번 SSR 시점에 무조건 true로
  // 평가되고, 그 HTML을 그대로 하이드레이션하면서 실제 브라우저의
  // 진짜 교차 여부와 무관하게 처음부터 다 드러난 상태로 굳어버렸다
  // (콘솔 로그로 관찰 IntersectionObserver 콜백은 isIntersecting:
  // false를 정확히 보고하는데도 최종 클래스는 이미 opacity-100인
  // 모순으로 발견). "환경에 따라 다른 초기값"은 SSR에서 항상 위험하다.
  const [revealed, setRevealed] = useState(false);
  const rootMargin = options.rootMargin ?? DEFAULT_OPTIONS.rootMargin;
  const threshold = options.threshold ?? DEFAULT_OPTIONS.threshold;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // 진짜 구형 브라우저 전용 경로 — effect 본문에서 곧장
      // setState하면 react-hooks/set-state-in-effect에 걸리므로
      // 다음 프레임으로 미룬다(어차피 극히 드문 폴백이라 한 프레임
      // 지연은 체감되지 않는다).
      const frame = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return { ref, revealed };
}
