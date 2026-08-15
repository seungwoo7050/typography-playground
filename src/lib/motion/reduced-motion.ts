"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/** prefers-reduced-motion: reduce 여부를 구독한다 —
 * CSS transition/animation은 globals.css의 전역 미디어 쿼리 하나로
 * 무력화되지만, 매 프레임 style.transform을 직접 대입하는 rAF
 * 루프(마그네틱 호버, 스크롤 패럴랙스)는 CSS로 잡을 수 없어 각 훅이
 * 이 값으로 분기한다. 마운트할 때 한 번만 읽으면 페이지를 연 채로 OS
 * 설정을 바꿨을 때 새로고침 전까지 반영되지 않아서, CustomCursor의
 * pointer 쿼리처럼 useSyncExternalStore로 변경을 따라간다. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}
