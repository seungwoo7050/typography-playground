"use client";

import { useEffect, useRef } from "react";

export interface MagneticRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MagneticOptions {
  /** 자력이 작용하기 시작하는 포인터-엘리먼트 중심 거리(px) */
  radius?: number;
  /** 포인터가 엘리먼트 중심에 있을 때의 최대 당김 강도(px) */
  strength?: number;
  /** lerp 계수(0-1) — 클수록 목표 위치를 더 빠르게 따라간다 */
  ease?: number;
}

const DEFAULT_OPTIONS: Required<MagneticOptions> = {
  radius: 70,
  strength: 16,
  ease: 0.15,
};

/**
 * 포인터가 엘리먼트 중심에서 radius 안에 있으면, 중심에 가까울수록
 * 1에 수렴하는 비율(pull)로 포인터 방향 오프셋을 계산한다. DOM/rAF와
 * 완전히 분리된 순수 함수라 유닛 테스트 가능하다 — 실제 매 프레임
 * 적용은 useMagnetic 훅이 lerp와 함께 담당한다.
 */
export function calculateMagneticOffset(
  pointerX: number,
  pointerY: number,
  rect: MagneticRect,
  radius: number,
  strength: number,
): { x: number; y: number } {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance >= radius) return { x: 0, y: 0 };

  const pull = 1 - distance / radius;
  return { x: dx * pull * (strength / radius), y: dy * pull * (strength / radius) };
}

/** current를 target 쪽으로 ease 비율만큼 선형 보간한다(스프링에 가까운
 * 감쇠 느낌을 매 프레임 반복 호출로 만든다 — 직접 스냅시키지 않음). */
export function lerp(current: number, target: number, ease: number): number {
  return current + (target - current) * ease;
}

/**
 * 엘리먼트를 포인터 쪽으로 부드럽게 끌어당기는 훅. pointermove로
 * 목표 오프셋을 계산하고, 별도의 rAF 루프가 lerp로 현재 위치를
 * 목표로 수렴시켜 transform을 갱신한다 — pointermove 핸들러 안에서
 * 바로 transform을 대입하면(직접 이벤트 포지셔닝) 딱딱하게 스냅되는
 * 느낌이 나기 때문에 반드시 분리한다.
 */
export function useMagnetic<T extends HTMLElement>(
  options: MagneticOptions = {},
) {
  const ref = useRef<T | null>(null);
  const current = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  const radius = options.radius ?? DEFAULT_OPTIONS.radius;
  const strength = options.strength ?? DEFAULT_OPTIONS.strength;
  const ease = options.ease ?? DEFAULT_OPTIONS.ease;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handlePointerMove(e: PointerEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      target.current = calculateMagneticOffset(
        e.clientX,
        e.clientY,
        rect,
        radius,
        strength,
      );
    }

    function tick() {
      current.current.x = lerp(current.current.x, target.current.x, ease);
      current.current.y = lerp(current.current.y, target.current.y, ease);
      if (el) {
        el.style.transform = `translate(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px)`;
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", handlePointerMove);
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [radius, strength, ease]);

  return ref;
}
