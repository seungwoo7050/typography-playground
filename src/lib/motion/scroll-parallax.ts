"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./reduced-motion";

export interface ScrollParallaxOptions {
  /** 스크롤 1px당 이동량 배수(클수록 더 크게, 더 빠르게 움직인다) */
  speed?: number;
  /** 이 픽셀만큼 스크롤하면 완전히 사라진다(opacity 0) */
  fadeDistance?: number;
}

const DEFAULT_OPTIONS: Required<ScrollParallaxOptions> = {
  speed: 0.3,
  fadeDistance: 320,
};

/**
 * scrollY로부터 translateY/opacity를 계산한다 — DOM/rAF와 분리된
 * 순수 함수라 유닛 테스트 가능하다. opacity는 0-1로 클램프한다(과도한
 * 스크롤에서 음수가 되지 않게).
 */
export function computeParallaxStyle(
  scrollY: number,
  speed: number,
  fadeDistance: number,
): { translateY: number; opacity: number } {
  const translateY = scrollY * speed;
  const opacity = Math.max(0, Math.min(1, 1 - scrollY / fadeDistance));
  return { translateY, opacity };
}

/**
 * 히어로 헤딩이 스크롤에 따라 살짝 위로 흘러가며 옅어지게 만드는
 * 훅 — 도구가 곧 랜딩 페이지인 이 제품에서 유일하게 존재하는
 * "히어로" 인터랙션 지점. scroll 이벤트 핸들러 안에서 직접
 * style을 대입하지 않고 rAF 루프에서 최신 scrollY를 반영해, 짧은
 * 시간에 scroll 이벤트가 몰려도 프레임당 한 번만 스타일을 갱신한다.
 */
export function useScrollParallax<T extends HTMLElement>(
  options: ScrollParallaxOptions = {},
) {
  const ref = useRef<T | null>(null);
  const speed = options.speed ?? DEFAULT_OPTIONS.speed;
  const fadeDistance = options.fadeDistance ?? DEFAULT_OPTIONS.fadeDistance;
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // reduced-motion에서는 루프를 아예 붙이지 않는다 — el.style는
    // 한 번도 대입되지 않아 기본 상태(변형 없음, 완전 불투명)로
    // 남는다.
    if (reducedMotion) return;

    let frame: number;

    function tick() {
      const { translateY, opacity } = computeParallaxStyle(
        window.scrollY,
        speed,
        fadeDistance,
      );
      if (el) {
        el.style.transform = `translateY(${translateY.toFixed(2)}px)`;
        el.style.opacity = opacity.toFixed(3);
      }
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      // 루프를 떼면 마지막으로 대입한 이동/투명도도 지운다.
      el.style.transform = "";
      el.style.opacity = "";
    };
  }, [speed, fadeDistance, reducedMotion]);

  return ref;
}
