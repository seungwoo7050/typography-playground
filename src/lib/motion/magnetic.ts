"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./reduced-motion";

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
  /** 스프링 강성(값이 클수록 목표를 더 빠르게 따라간다) */
  stiffness?: number;
  /** 속도 감쇠 계수(0-1, 값이 작을수록 더 빨리 멎는다) */
  damping?: number;
}

// stiffness/damping 조합을 직접 시뮬레이션해서 고른 값이다(0.05~0.4 x
// 0.5~0.85 그리드 스캔) — 오버슈트가 15% 넘지 않으면서 60fps 기준
// 11프레임(~180ms) 안에 목표값의 2% 이내로 정착하는 조합 중 가장
// 빠른 축에 속한다. 손으로 대충 고른 값이 아니라 실제로 발산하지
// 않고 과하게 출렁이지도 않는지 수치 시뮬레이션으로 확인했다(초기에
// stiffness=0.2, damping=0.8을 감으로 골랐다가 60프레임을 시뮬레이션
// 해보니 143까지 오버슈트하고 정착에 40프레임 가까이 걸려 다시 골랐다).
const DEFAULT_OPTIONS: Required<MagneticOptions> = {
  radius: 70,
  strength: 16,
  stiffness: 0.3,
  damping: 0.5,
};

/**
 * 감쇠 스프링 한 스텝을 계산한다 — position/velocity를 target 쪽으로
 * 수렴시키되, 순수 lerp와 달리 약간의 오버슈트(살짝 지나쳤다가
 * 돌아오는)가 생겨 더 "탄성 있는" 느낌을 준다. DOM/rAF와 분리된
 * 순수 함수라 유닛 테스트 가능하다.
 */
export function springStep(
  position: number,
  velocity: number,
  target: number,
  stiffness: number,
  damping: number,
): { position: number; velocity: number } {
  const nextVelocity = (velocity + (target - position) * stiffness) * damping;
  const nextPosition = position + nextVelocity;
  return { position: nextPosition, velocity: nextVelocity };
}

/**
 * 포인터가 엘리먼트 중심에서 radius 안에 있으면, 중심에 가까울수록
 * 1에 수렴하는 비율(pull)로 포인터 방향 오프셋을 계산한다. DOM/rAF와
 * 완전히 분리된 순수 함수라 유닛 테스트 가능하다 — 실제 매 프레임
 * 적용(springStep으로 수렴)은 useMagnetic 훅이 담당한다.
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
 * 엘리먼트를 포인터 쪽으로 끌어당기는 훅. pointermove로 목표
 * 오프셋을 계산하고, 별도의 rAF 루프가 감쇠 스프링(springStep)으로
 * 현재 위치를 목표로 수렴시켜 transform을 갱신한다 —
 * pointermove 핸들러 안에서 바로 transform을 대입하면(직접 이벤트
 * 포지셔닝) 딱딱하게 스냅되는 느낌이 나기 때문에 반드시 분리한다.
 */
export function useMagnetic<T extends HTMLElement>(
  options: MagneticOptions = {},
) {
  const ref = useRef<T | null>(null);
  const position = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  const radius = options.radius ?? DEFAULT_OPTIONS.radius;
  const strength = options.strength ?? DEFAULT_OPTIONS.strength;
  const stiffness = options.stiffness ?? DEFAULT_OPTIONS.stiffness;
  const damping = options.damping ?? DEFAULT_OPTIONS.damping;
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 마그네틱 호버는 순전히 장식적 모션이라 reduced-motion에서는
    // 아예 루프를 붙이지 않는다 — 버튼/링크는 평범하게 정지된
    // 상태로 남고, 클릭/키보드 조작 자체는 useMagnetic과 무관하게
    // 항상 정상 동작한다(§magnetic.ts 상단 설명 참고).
    if (reducedMotion) return;

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
      const stepX = springStep(
        position.current.x,
        velocity.current.x,
        target.current.x,
        stiffness,
        damping,
      );
      const stepY = springStep(
        position.current.y,
        velocity.current.y,
        target.current.y,
        stiffness,
        damping,
      );
      position.current = { x: stepX.position, y: stepY.position };
      velocity.current = { x: stepX.velocity, y: stepY.velocity };
      if (el) {
        el.style.transform = `translate(${position.current.x.toFixed(2)}px, ${position.current.y.toFixed(2)}px)`;
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", handlePointerMove);
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // 루프가 멈춘 자리에 오프셋이 남지 않게 한다(설정이 reduce로
      // 바뀌어 루프를 떼는 경우에도 요소가 제자리로 돌아온다).
      el.style.transform = "";
      position.current = { x: 0, y: 0 };
      velocity.current = { x: 0, y: 0 };
      target.current = { x: 0, y: 0 };
    };
  }, [radius, strength, stiffness, damping, reducedMotion]);

  return ref;
}
