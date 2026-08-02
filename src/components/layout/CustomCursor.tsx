"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { lerp } from "@/lib/motion/magnetic";

const HOVER_TARGET_SELECTOR = "button, a, input, textarea, select";
const RING_EASE = 0.2;
const FINE_POINTER_QUERY = "(pointer: fine)";

function subscribeFinePointer(callback: () => void) {
  const mql = window.matchMedia(FINE_POINTER_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getFinePointerSnapshot() {
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

function getFinePointerServerSnapshot() {
  // SSR/정적 export 시점엔 포인터 종류를 알 수 없다 — 커서를 그리지
  // 않는 쪽(false)을 기본값으로 둬 터치 기기에서 깜빡임 없이 안전하다.
  return false;
}

/**
 * 점(dot)은 포인터 위치를 지연 없이 그대로 따라가고, 링(ring)은 rAF
 * 루프에서 lerp로 지연을 두고 따라간다 — 흔한 커스텀 커서 구현
 * 패턴(점은 정확한 클릭 지점을, 링은 무게감 있는 추적을 표현).
 *
 * 터치/펜처럼 정밀 포인터가 없는 기기에서는 아예 렌더링하지 않는다.
 * matchMedia 구독은 useEffect 안에서 setState하는 대신
 * useSyncExternalStore로 처리한다(2-in-1 기기에서 포인터 종류가
 * 바뀌는 것도 반영되고, effect 본문에서 직접 setState하는 걸
 * 피하라는 린트 규칙에도 맞는다).
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const enabled = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    getFinePointerServerSnapshot,
  );

  useEffect(() => {
    if (!enabled) return;

    const ringPos = { x: 0, y: 0 };
    const dotPos = { x: 0, y: 0 };
    let frame: number;

    function handlePointerMove(e: PointerEvent) {
      dotPos.x = e.clientX;
      dotPos.y = e.clientY;
      setVisible(true);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      const target = e.target as HTMLElement | null;
      setHovering(!!target?.closest(HOVER_TARGET_SELECTOR));
    }

    function tick() {
      ringPos.x = lerp(ringPos.x, dotPos.x, RING_EASE);
      ringPos.y = lerp(ringPos.y, dotPos.y, RING_EASE);
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
      }
      frame = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", handlePointerMove);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className={`pointer-events-none fixed top-0 left-0 z-50 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink transition-opacity duration-150 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={ringRef}
        aria-hidden
        className={`pointer-events-none fixed top-0 left-0 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink transition-[width,height,opacity] duration-200 ${
          hovering ? "h-10 w-10" : "h-6 w-6"
        } ${visible ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
